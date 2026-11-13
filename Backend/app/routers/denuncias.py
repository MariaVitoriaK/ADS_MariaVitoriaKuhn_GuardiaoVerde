import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
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


@router.post("/{id_denuncia}/status", status_code=status.HTTP_200_OK)
def alterar_status_denuncia(
    id_denuncia: int,
    novo_status: str,
    observacao: str,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None,
    current_user: Usuario = Depends(get_current_active_user),
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
        nome_admin="Administrador",
        username_admin="admin",
    )
    db.add(historico)

    denuncia.status = status_alterado
    db.commit()
    db.refresh(denuncia)

    if denuncia.id_usuario is not None and background_tasks is not None:
        usuario = db.query(Usuario).filter(Usuario.id_usuario == denuncia.id_usuario).first()
        if usuario and usuario.email and usuario.email_verificado:
            background_tasks.add_task(
                send_report_status_email,
                usuario.email,
                denuncia.titulo or "Denúncia",
                status_alterado,
                observacao or "Status atualizado pelo administrador.",
            )

    return {"message": "Status atualizado com sucesso.", "status": status_alterado}


@router.post("/me/verificar-email", status_code=status.HTTP_200_OK)
def solicitar_verificacao_email(
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None,
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
