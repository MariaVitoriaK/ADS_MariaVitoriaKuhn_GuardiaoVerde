from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.noticia import ComentarioCreate, NoticiaCreate, NoticiaOut
from app.models.models import Comentario, Curtida, Noticia, Usuario
from app.core.security import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/noticias", tags=["Notícias"])

def serializar_noticia(noticia, total_curtidas, total_comentarios, curtida_pelo_usuario, comentarios=None):
    return {
        "id_noticia": noticia.id_noticia,
        "id_usuario": noticia.id_usuario,
        "titulo": noticia.titulo,
        "conteudo": noticia.conteudo,
        "imagem": noticia.imagem,
        "status": noticia.status,
        "data_publicacao": noticia.data_publicacao,
        "total_curtidas": total_curtidas,
        "total_comentarios": total_comentarios,
        "curtida_pelo_usuario": curtida_pelo_usuario,
        "comentarios": comentarios or [],
    }

@router.get("/", response_model=list[NoticiaOut])
def listar_noticias(
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    curtidas = (
        db.query(Curtida.id_noticia, func.count(Curtida.id_curtida).label("total"))
        .group_by(Curtida.id_noticia)
        .subquery()
    )
    comentarios = (
        db.query(Comentario.id_noticia, func.count(Comentario.id_comentario).label("total"))
        .filter(or_(Comentario.status != "excluido", Comentario.status.is_(None)))
        .group_by(Comentario.id_noticia)
        .subquery()
    )
    noticias = (
        db.query(
            Noticia,
            func.coalesce(curtidas.c.total, 0),
            func.coalesce(comentarios.c.total, 0),
        )
        .outerjoin(curtidas, curtidas.c.id_noticia == Noticia.id_noticia)
        .outerjoin(comentarios, comentarios.c.id_noticia == Noticia.id_noticia)
        .filter(Noticia.status == "publicada")
        .order_by(Noticia.data_publicacao.desc())
        .all()
    )
    noticias_curtidas = {
        id_noticia
        for (id_noticia,) in db.query(Curtida.id_noticia)
        .filter(Curtida.id_usuario == user.id_usuario)
        .all()
    }
    return [
        serializar_noticia(
            noticia,
            total_curtidas,
            total_comentarios,
            noticia.id_noticia in noticias_curtidas,
        )
        for noticia, total_curtidas, total_comentarios in noticias
    ]

@router.get("/{id_noticia}", response_model=NoticiaOut)
def obter_noticia(
    id_noticia: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    noticia = db.query(Noticia).filter(
        Noticia.id_noticia == id_noticia,
        Noticia.status == "publicada",
    ).first()
    if noticia is None:
        raise HTTPException(status_code=404, detail="Notícia não encontrada.")

    comentarios = (
        db.query(Comentario, Usuario)
        .outerjoin(Usuario, Usuario.id_usuario == Comentario.id_usuario)
        .filter(
            Comentario.id_noticia == id_noticia,
            or_(Comentario.status != "excluido", Comentario.status.is_(None)),
        )
        .order_by(Comentario.data_comentario.asc())
        .all()
    )
    comentarios_serializados = [
        {
            "id_comentario": comentario.id_comentario,
            "id_usuario": comentario.id_usuario,
            "nome_usuario": autor.nome if autor else "Usuário",
            "foto_perfil": autor.foto_perfil if autor else None,
            "texto": comentario.texto,
            "data_comentario": comentario.data_comentario,
        }
        for comentario, autor in comentarios
    ]
    total_curtidas = db.query(Curtida).filter(Curtida.id_noticia == id_noticia).count()
    total_comentarios = len(comentarios_serializados)
    curtida_pelo_usuario = db.query(Curtida).filter_by(
        id_noticia=id_noticia,
        id_usuario=user.id_usuario,
    ).first() is not None
    return serializar_noticia(
        noticia,
        total_curtidas,
        total_comentarios,
        curtida_pelo_usuario,
        comentarios_serializados,
    )

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
    noticia = db.query(Noticia).filter(
        Noticia.id_noticia == id_noticia,
        Noticia.status == "publicada",
    ).first()
    if noticia is None:
        raise HTTPException(status_code=404, detail="Notícia não encontrada.")

    curtida_existente = db.query(Curtida).filter_by(id_noticia=id_noticia, id_usuario=user.id_usuario).first()
    if curtida_existente:
        db.delete(curtida_existente)
        curtida_pelo_usuario = False
    else:
        nova_curtida = Curtida(
            id_noticia=id_noticia,
            id_usuario=user.id_usuario,
            data_curtida=datetime.utcnow(),
        )
        db.add(nova_curtida)
        curtida_pelo_usuario = True
    db.commit()
    total_curtidas = db.query(Curtida).filter(Curtida.id_noticia == id_noticia).count()
    return {
        "curtida_pelo_usuario": curtida_pelo_usuario,
        "total_curtidas": total_curtidas,
    }

@router.post("/{id_noticia}/comentarios", response_model=NoticiaOut)
def comentar_noticia(
    id_noticia: int,
    dados: ComentarioCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    noticia = db.query(Noticia).filter(
        Noticia.id_noticia == id_noticia,
        Noticia.status == "publicada",
    ).first()
    if noticia is None:
        raise HTTPException(status_code=404, detail="Notícia não encontrada.")

    texto = dados.texto.strip()
    if not texto:
        raise HTTPException(status_code=422, detail="O comentário não pode estar vazio.")

    comentario = Comentario(
        id_noticia=id_noticia,
        id_usuario=user.id_usuario,
        texto=texto,
        data_comentario=datetime.utcnow(),
        status="publicado",
    )
    db.add(comentario)
    db.commit()
    return obter_noticia(id_noticia, db, user)