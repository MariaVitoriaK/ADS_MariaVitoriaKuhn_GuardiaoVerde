from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.models import StatusUsuario, TipoUsuario, Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioPerfilAtualizado, UsuarioUpdate, UsuarioUpdateSenha, UsuarioStatusUpdate
from app.core.security import create_access_token, get_current_active_user, get_current_admin_user, get_password_hash, verify_password

router = APIRouter(prefix="/usuarios", tags=["Usuários"])
PROFILE_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "profiles"
PROFILE_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024

@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if usuario_existente:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já está em uso.")

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=get_password_hash(dados.senha),
        tipo_usuario=TipoUsuario.usuario,
        status=StatusUsuario.ativo,
        data_cadastro=datetime.now(),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

# ==========================================
# ROTAS DE AUTOGERENCIAMENTO (Meu Perfil)
# ==========================================

@router.get("/me", response_model=UsuarioOut)
def ler_usuario_logado(current_user: Usuario = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=UsuarioPerfilAtualizado)
def atualizar_perfil(
    dados: UsuarioUpdate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    if dados.nome:
        current_user.nome = dados.nome
    if dados.email:
        # Verifica se o novo e-mail já está em uso
        email_em_uso = db.query(Usuario).filter(Usuario.email == dados.email).first()
        if email_em_uso and email_em_uso.id_usuario != current_user.id_usuario:
            raise HTTPException(status_code=400, detail="E-mail já está em uso.")
        current_user.email = dados.email
        
    db.commit()
    db.refresh(current_user)
    return {
        "id_usuario": current_user.id_usuario,
        "nome": current_user.nome,
        "email": current_user.email,
        "tipo_usuario": current_user.tipo_usuario,
        "status": current_user.status,
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

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def excluir_conta(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
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
    
    usuario.status = dados.status
    db.commit()
    db.refresh(usuario)
    return usuario