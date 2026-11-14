import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user, get_current_admin_user
from app.database import get_db
from app.models.models import Denuncia, HistoricoDenuncia, Usuario
from app.services.email_service import send_email_verification_email, send_report_status_email

router = APIRouter(prefix="/denuncias", tags=["Denúncias"])


def validar_status_denuncia(status: str) -> str:
    status_normalizado = (status or "").strip().lower()
    valores_validos = {"pendente", "aceita", "em_andamento", "resolvida", "recusada"}
    if status_normalizado not in valores_validos:
        raise HTTPException(status_code=400, detail="Status da denúncia inválido.")
    return status_normalizado


def serializar_historico(historico: HistoricoDenuncia) -> dict:
    return {
        "id_historico": historico.id_historico,
        "id_denuncia": historico.id_denuncia,
        "id_usuario": historico.id_usuario,
        "status_anterior": historico.status_anterior,
        "novo_status": historico.novo_status,
        "observacao": historico.observacao,
        "nome_admin": historico.nome_admin,
        "username_admin": historico.username_admin,
        "data_alteracao": historico.data_alteracao,
    }


def serializar_denuncia(denuncia: Denuncia) -> dict:
    historico = (
        list(
            map(
                serializar_historico,
                denuncia.historico if hasattr(denuncia, "historico") else [],
            )
        )
        if hasattr(denuncia, "historico")
        else []
    )
    return {
        "id_denuncia": denuncia.id_denuncia,
        "id_usuario": denuncia.id_usuario,
        "titulo": denuncia.titulo,
        "descricao": denuncia.descricao,
        "categoria": denuncia.categoria,
        "localizacao": denuncia.localizacao,
        "cidade": denuncia.cidade,
        "estado": denuncia.estado,
        "latitude": str(denuncia.latitude) if denuncia.latitude is not None else "",
        "longitude": str(denuncia.longitude) if denuncia.longitude is not None else "",
        "data_ocorrencia": denuncia.data_ocorrencia.isoformat() if denuncia.data_ocorrencia else None,
        "gravidade": denuncia.gravidade,
        "status": (denuncia.status or "pendente").strip().lower(),
        "data_registro": denuncia.data_registro,
        "historico": historico,
    }


@router.get("/", status_code=status.HTTP_200_OK)
def listar_denuncias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    denuncias = db.query(Denuncia).order_by(Denuncia.data_registro.desc()).all()
    return [serializar_denuncia(denuncia) for denuncia in denuncias]


@router.get("/me", status_code=status.HTTP_200_OK)
def listar_minhas_denuncias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    denuncias = (
        db.query(Denuncia)
        .filter(Denuncia.id_usuario == current_user.id_usuario)
        .order_by(Denuncia.data_registro.desc())
        .all()
    )
    return [serializar_denuncia(denuncia) for denuncia in denuncias]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_denuncia(
    dados: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    titulo = (dados.get("titulo") or "").strip()
    descricao = (dados.get("descricao") or "").strip()
    categoria = (dados.get("categoria") or "Outros").strip() or "Outros"
    cidade = (dados.get("cidade") or "").strip()
    estado = (dados.get("estado") or "").strip()
    gravidade = (dados.get("gravidade") or "media").strip().lower()
    data_ocorrencia = dados.get("data_ocorrencia") or datetime.utcnow().date().isoformat()

    if not titulo:
        raise HTTPException(status_code=400, detail="O título da denúncia é obrigatório.")
    if not descricao:
        raise HTTPException(status_code=400, detail="A descrição da denúncia é obrigatória.")

    nova_denuncia = Denuncia(
        id_usuario=current_user.id_usuario,
        titulo=titulo,
        descricao=descricao,
        categoria=categoria,
        localizacao=dados.get("localizacao") or "Local não informado",
        cidade=cidade or "Cidade não informada",
        estado=estado or "SP",
        latitude=dados.get("latitude"),
        longitude=dados.get("longitude"),
        data_ocorrencia=datetime.fromisoformat(str(data_ocorrencia)).date() if isinstance(data_ocorrencia, str) else data_ocorrencia,
        gravidade=gravidade,
        status="pendente",
        data_registro=datetime.utcnow(),
    )
    db.add(nova_denuncia)
    db.commit()
    db.refresh(nova_denuncia)

    historico_inicial = HistoricoDenuncia(
        id_denuncia=nova_denuncia.id_denuncia,
        id_usuario=current_user.id_usuario,
        status_anterior="pendente",
        novo_status="pendente",
        observacao="Denúncia registrada e encaminhada para o administrador.",
        data_alteracao=datetime.utcnow(),
    )
    db.add(historico_inicial)
    db.commit()
    return serializar_denuncia(nova_denuncia)


@router.post("/{id_denuncia}/status", status_code=status.HTTP_200_OK)
def alterar_status_denuncia(
    id_denuncia: int,
    novo_status: str = Query(..., alias="novo_status"),
    observacao: str = Query(default="Status atualizado pelo administrador.", alias="observacao"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user),
):
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denúncia não encontrada.")

    status_anterior = (denuncia.status or "pendente").strip().lower()
    status_alterado = validar_status_denuncia(novo_status)

    historico = HistoricoDenuncia(
        id_denuncia=denuncia.id_denuncia,
        id_usuario=denuncia.id_usuario,
        status_anterior=status_anterior,
        novo_status=status_alterado,
        observacao=observacao or "Status atualizado pelo administrador.",
        data_alteracao=datetime.utcnow(),
        nome_admin=current_user.nome,
        username_admin=current_user.username,
    )
    db.add(historico)

    denuncia.status = status_alterado
    db.commit()
    db.refresh(denuncia)

    if background_tasks is not None and denuncia.id_usuario is not None:
        usuario = db.query(Usuario).filter(Usuario.id_usuario == denuncia.id_usuario).first()
        if usuario and usuario.email and usuario.email_verificado:
            background_tasks.add_task(
                send_report_status_email,
                usuario.email,
                denuncia.titulo or "Denúncia",
                status_alterado,
                observacao or "Status atualizado pelo administrador.",
            )
            print(f"[EMAIL] Tarefa agendada para {usuario.email} -> status da denúncia {id_denuncia} atualizado para {status_alterado}")

    return {"message": "Status atualizado com sucesso.", "status": status_alterado}


@router.post("/me/verificar-email", status_code=status.HTTP_200_OK)
def solicitar_verificacao_email(
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    email = (current_user.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Usuário sem e-mail cadastrado.")

    token = secrets.token_urlsafe(24)
    current_user.email_verificacao_token = token
    current_user.email_verificacao_expira_em = datetime.utcnow() + timedelta(hours=24)
    current_user.email_verificado = False
    db.commit()

    if background_tasks is not None:
        verification_link = f"http://localhost:5173/perfil?token={token}&email={email}"
        background_tasks.add_task(
            send_email_verification_email,
            email,
            verification_link,
            current_user.nome,
        )

    return {"message": "Verificação enviada com sucesso. Confira seu e-mail para confirmar."}


@router.get("/verificar-email/{token}", status_code=status.HTTP_200_OK)
def confirmar_verificacao_email(token: str, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email_verificacao_token == token).first()
    if not usuario:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

    if usuario.email_verificacao_expira_em and datetime.utcnow() > usuario.email_verificacao_expira_em:
        raise HTTPException(status_code=400, detail="Token expirado. Solicite uma nova verificação.")

    usuario.email_verificado = True
    usuario.email_verificacao_token = None
    usuario.email_verificacao_expira_em = None
    db.commit()
    return {"message": "E-mail verificado com sucesso.", "email_verificado": True}
