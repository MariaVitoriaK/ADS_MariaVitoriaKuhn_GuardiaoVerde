from pathlib import Path
import re
import secrets
from uuid import uuid4
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from email_validator import EmailNotValidError, validate_email
from app.database import get_db
from app.models.models import Comentario, Curtida, Denuncia, HistoricoDenuncia, Noticia, ONG, StatusUsuario, TipoUsuario, Usuario
from app.schemas.usuario import UsuarioAdminCreate, UsuarioCreate, UsuarioOut, UsuarioPerfilAtualizado, UsuarioUpdate, UsuarioUpdateSenha, UsuarioStatusUpdate
from app.core.security import atualizar_status_bloqueio_automatico, create_access_token, get_current_active_user, get_current_admin_user, get_current_primary_admin_user, get_password_hash, verify_password
from app.services.email_service import send_email_verification_email

router = APIRouter(prefix="/usuarios", tags=["Usuários"])
PROFILE_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "profiles"
PROFILE_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024

def validar_username(username: str, db: Session, id_usuario: int | None = None) -> str:
    username_normalizado = username.strip().lower()
    if not re.fullmatch(r"[a-z0-9._-]{3,30}", username_normalizado):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O username deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.",
        )

    consulta = db.query(Usuario).filter(func.lower(Usuario.username) == username_normalizado)
    if id_usuario is not None:
        consulta = consulta.filter(Usuario.id_usuario != id_usuario)
    if consulta.first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username já está em uso.")
    return username_normalizado


def gerar_codigo_verificacao() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def validar_email_para_verificacao(email: str) -> str:
    email_limpo = str(email or "").strip().lower()
    if not email_limpo:
        raise ValueError("E-mail obrigatório.")

    try:
        email_validado = validate_email(email_limpo, check_deliverability=False)
    except EmailNotValidError as exc:
        raise ValueError("E-mail inválido.") from exc

    return email_validado.normalized

@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    email = str(dados.email).strip().lower()
    usuario_existente = db.query(Usuario).filter(func.lower(Usuario.email) == email).first()
    if usuario_existente:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já está em uso.")

    usuario = Usuario(
        nome=dados.nome,
        username=validar_username(dados.username, db),
        email=email,
        senha_hash=get_password_hash(dados.senha),
        tipo_usuario=TipoUsuario.usuario,
        status=StatusUsuario.ativo,
        email_verificado=False,
        data_cadastro=datetime.now(),
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail ou username já está em uso.") from error
    db.refresh(usuario)
    return usuario


@router.post("/administradores", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def criar_administrador_secundario(
    dados: UsuarioAdminCreate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_primary_admin_user),
):
    if not current_admin.administrador_principal:
        raise HTTPException(status_code=403, detail="Apenas o administrador principal pode criar administradores.")

    nome = dados.nome.strip()
    if db.query(Usuario).filter(
        func.lower(Usuario.nome) == nome.lower(),
        Usuario.tipo_usuario == TipoUsuario.administrador,
    ).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um administrador com esse nome.")

    email = str(dados.email).strip().lower()
    if db.query(Usuario).filter(func.lower(Usuario.email) == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já está em uso.")

    administrador = Usuario(
        nome=nome,
        username=validar_username(dados.username, db),
        email=email,
        senha_hash=get_password_hash(dados.senha),
        tipo_usuario=TipoUsuario.administrador,
        administrador_principal=False,
        status=StatusUsuario.ativo,
        email_verificado=True,
        data_cadastro=datetime.now(),
    )
    db.add(administrador)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail ou username já está em uso.") from error
    db.refresh(administrador)
    return administrador

# ==========================================
# ROTAS DE AUTOGERENCIAMENTO (Meu Perfil)
# ==========================================

@router.get("/me", response_model=UsuarioOut)
def ler_usuario_logado(current_user: Usuario = Depends(get_current_active_user)):
    return current_user

@router.post("/me/verificar-email", status_code=status.HTTP_200_OK)
def solicitar_verificacao_email(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        email_validado = validar_email_para_verificacao(current_user.email)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    codigo_verificacao = gerar_codigo_verificacao()
    current_user.email = email_validado
    current_user.email_verificacao_token = codigo_verificacao
    current_user.email_verificacao_expira_em = datetime.utcnow() + timedelta(minutes=10)
    current_user.email_verificado = False
    db.commit()

    verification_link = f"http://localhost:5173/perfil?verificacao=ok&codigo={codigo_verificacao}"
    if background_tasks is not None:
        background_tasks.add_task(
            send_email_verification_email,
            email_validado,
            codigo_verificacao,
            current_user.nome,
            verification_link,
        )

    return {
        "message": "Código de verificação enviado para o seu e-mail.",
        "email_verificado": False,
        "codigo": codigo_verificacao,
    }

@router.post("/me/verificar-email/confirmar", status_code=status.HTTP_200_OK)
def confirmar_verificacao_email_por_codigo(
    dados: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    codigo = str(dados.get("codigo", "") or "").strip()
    if len(codigo) != 6 or not codigo.isdigit():
        raise HTTPException(status_code=400, detail="Código de verificação inválido.")

    if not current_user.email_verificacao_token:
        raise HTTPException(status_code=400, detail="Nenhum código de verificação foi solicitado.")

    if current_user.email_verificacao_expira_em and datetime.utcnow() > current_user.email_verificacao_expira_em:
        raise HTTPException(status_code=400, detail="Código expirado. Solicite uma nova verificação.")

    if current_user.email_verificacao_token != codigo:
        raise HTTPException(status_code=400, detail="Código incorreto.")

    current_user.email_verificado = True
    current_user.email_verificacao_token = None
    current_user.email_verificacao_expira_em = None
    db.commit()
    return {"message": "E-mail verificado com sucesso.", "email_verificado": True}

@router.get("/me/verificar-email/{token}", status_code=status.HTTP_200_OK)
def confirmar_verificacao_email(token: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if not current_user.email_verificacao_token:
        raise HTTPException(status_code=400, detail="Nenhum código de verificação foi solicitado.")

    if current_user.email_verificacao_expira_em and datetime.utcnow() > current_user.email_verificacao_expira_em:
        raise HTTPException(status_code=400, detail="Código expirado. Solicite uma nova verificação.")

    if current_user.email_verificacao_token != token:
        raise HTTPException(status_code=400, detail="Token de verificação inválido ou expirado.")

    current_user.email_verificado = True
    current_user.email_verificacao_token = None
    current_user.email_verificacao_expira_em = None
    db.commit()
    return {"message": "E-mail verificado com sucesso.", "email_verificado": True}

@router.put("/me", response_model=UsuarioPerfilAtualizado)
def atualizar_perfil(
    dados: UsuarioUpdate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    if dados.nome:
        current_user.nome = dados.nome
    if dados.username is not None:
        current_user.username = validar_username(dados.username, db, current_user.id_usuario)
    if dados.email:
        try:
            email_normalizado = validar_email_para_verificacao(dados.email)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        if current_user.administrador_principal and email_normalizado != "admin@email.com":
            raise HTTPException(status_code=400, detail="O e-mail do administrador principal não pode ser alterado.")
        email_em_uso = db.query(Usuario).filter(func.lower(Usuario.email) == email_normalizado).first()
        if email_em_uso and email_em_uso.id_usuario != current_user.id_usuario:
            raise HTTPException(status_code=400, detail="E-mail já está em uso.")
        current_user.email = email_normalizado
        current_user.email_verificado = current_user.tipo_usuario == TipoUsuario.administrador
        current_user.email_verificacao_token = None
        current_user.email_verificacao_expira_em = None
        
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail ou username já está em uso.") from error
    db.refresh(current_user)
    return {
        "id_usuario": current_user.id_usuario,
        "nome": current_user.nome,
        "username": current_user.username,
        "email": current_user.email,
        "tipo_usuario": current_user.tipo_usuario,
        "administrador_principal": current_user.administrador_principal,
        "status": current_user.status,
        "email_verificado": current_user.email_verificado,
        "foto_perfil": current_user.foto_perfil,
        "access_token": create_access_token({"sub": current_user.email}),
    }

@router.put("/me/foto", response_model=UsuarioOut)
async def atualizar_foto_perfil(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    extensao = PROFILE_IMAGE_TYPES.get(file.content_type or "")
    if extensao is None:
        raise HTTPException(status_code=415, detail="Formato de imagem não suportado.")

    conteudo = await file.read(MAX_PROFILE_IMAGE_SIZE + 1)
    if not conteudo:
        raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")
    if len(conteudo) > MAX_PROFILE_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="A imagem deve ter no máximo 5 MB.")

    PROFILE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    nome_arquivo = f"{uuid4().hex}{extensao}"
    caminho_arquivo = PROFILE_UPLOAD_DIR / nome_arquivo
    caminho_arquivo.write_bytes(conteudo)

    current_user.foto_perfil = f"/uploads/profiles/{nome_arquivo}"
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/senha")
def alterar_senha(
    dados: UsuarioUpdateSenha, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    if not verify_password(dados.senha_atual, current_user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    
    current_user.senha_hash = get_password_hash(dados.nova_senha)
    db.commit()
    return {"message": "Senha atualizada com sucesso."}

def remover_curtidas_do_usuario(db: Session, id_usuario: int):
    db.query(Curtida).filter(Curtida.id_usuario == id_usuario).delete(synchronize_session=False)


def preservar_autorias_antes_de_excluir(db: Session, usuario: Usuario):
    db.query(Noticia).filter(Noticia.id_usuario == usuario.id_usuario).update(
        {Noticia.autor_nome: usuario.nome, Noticia.autor_username: usuario.username, Noticia.id_usuario: None},
        synchronize_session=False,
    )
    db.query(Comentario).filter(Comentario.id_usuario == usuario.id_usuario).update(
        {
            Comentario.nome_usuario_autor: usuario.nome,
            Comentario.username_usuario_autor: usuario.username,
            Comentario.id_usuario: None,
        },
        synchronize_session=False,
    )
    db.query(HistoricoDenuncia).filter(HistoricoDenuncia.id_usuario == usuario.id_usuario).update(
        {
            HistoricoDenuncia.nome_admin: usuario.nome,
            HistoricoDenuncia.username_admin: usuario.username,
            HistoricoDenuncia.id_usuario: None,
        },
        synchronize_session=False,
    )
    db.query(Denuncia).filter(Denuncia.id_usuario == usuario.id_usuario).update(
        {Denuncia.id_usuario: None},
        synchronize_session=False,
    )
    db.query(ONG).filter(ONG.id_usuario_cadastro == usuario.id_usuario).update(
        {ONG.id_usuario_cadastro: None},
        synchronize_session=False,
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def excluir_conta(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    remover_curtidas_do_usuario(db, current_user.id_usuario)
    preservar_autorias_antes_de_excluir(db, current_user)
    db.delete(current_user)
    db.commit()
    return None

# ==========================================
# ROTAS ADMINISTRATIVAS
# ==========================================

@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), current_admin: Usuario = Depends(get_current_admin_user)):
    usuarios = db.query(Usuario).all()
    return usuarios

@router.put("/{id_usuario}/status", response_model=UsuarioOut)
def alterar_status_usuario(
    id_usuario: int,
    dados: UsuarioStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if usuario.administrador_principal:
        raise HTTPException(status_code=403, detail="O administrador principal não pode ser bloqueado.")
    if usuario.tipo_usuario == TipoUsuario.administrador and (
        not current_admin.administrador_principal or current_admin.id_usuario == usuario.id_usuario
    ):
        raise HTTPException(status_code=403, detail="Apenas o administrador principal pode alterar outro administrador.")

    novo_status = dados.status.lower()

    if novo_status == "banido":
        duracao = (dados.duracao or "30_dias").lower()
        if duracao == "30_dias":
            usuario.bloqueado_ate = datetime.utcnow() + timedelta(days=30)
        elif duracao == "90_dias":
            usuario.bloqueado_ate = datetime.utcnow() + timedelta(days=90)
        elif duracao == "permanente":
            usuario.bloqueado_ate = None
        else:
            raise HTTPException(status_code=400, detail="Duração de bloqueio inválida.")
        usuario.status = StatusUsuario.banido
    elif novo_status == "ativo":
        usuario.status = StatusUsuario.ativo
        usuario.bloqueado_ate = None
    elif novo_status == "inativo":
        usuario.status = StatusUsuario.inativo
        usuario.bloqueado_ate = None
    else:
        raise HTTPException(status_code=400, detail="Status inválido.")

    db.commit()
    db.refresh(usuario)
    atualizar_status_bloqueio_automatico(db, usuario)
    return usuario


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_administrador_secundario(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_primary_admin_user),
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if (
        usuario.tipo_usuario != TipoUsuario.administrador
        or usuario.administrador_principal
        or usuario.id_usuario == current_admin.id_usuario
    ):
        raise HTTPException(status_code=403, detail="Somente administradores secundários podem ser excluídos.")

    remover_curtidas_do_usuario(db, usuario.id_usuario)
    preservar_autorias_antes_de_excluir(db, usuario)
    db.delete(usuario)
    db.commit()
    return None