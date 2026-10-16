from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.noticia import NoticiaCreate, NoticiaOut
from app.models.models import Noticia, Curtida
from app.core.security import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/noticias", tags=["Notícias"])

@router.get("/", response_model=list[NoticiaOut])
def listar_noticias(db: Session = Depends(get_db)):
    noticias = db.query(Noticia).filter(Noticia.status == "publicada").all()
    return noticias

@router.post("/", response_model=NoticiaOut)
def criar_noticia(
    noticia: NoticiaCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):
    nova_noticia = Noticia(
        titulo=noticia.titulo,
        conteudo=noticia.conteudo,
        imagem=noticia.imagem,
        status=noticia.status,
        id_usuario=admin.id_usuario,
        data_publicacao=datetime.utcnow(),
    )
    db.add(nova_noticia)
    db.commit()
    db.refresh(nova_noticia)
    return nova_noticia

@router.post("/{id_noticia}/curtir")
def curtir_noticia(
    id_noticia: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    curtida_existente = db.query(Curtida).filter_by(id_noticia=id_noticia, id_usuario=user.id_usuario).first()
    if curtida_existente:
        db.delete(curtida_existente)
        db.commit()
        return {"message": "Curtida removida"}

    nova_curtida = Curtida(id_noticia=id_noticia, id_usuario=user.id_usuario)
    db.add(nova_curtida)
    db.commit()
    return {"message": "Notícia curtida com sucesso"}