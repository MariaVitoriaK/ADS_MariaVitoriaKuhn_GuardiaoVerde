from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.noticia import NoticiaCreate, NoticiaOut
from app.models import Noticia, Curtida, Comentario
# Dependências fictícias de autenticação baseadas no seu projeto
from app.core.security import get_current_user, get_admin_user 

router = APIRouter(prefix="/noticias", tags=["Notícias"])

@router.get("/", response_model=list[NoticiaOut])
def listar_noticias(db: Session = Depends(get_db)):
    # HU07: Usuários visualizam notícias publicadas
    noticias = db.query(Noticia).filter(Noticia.status == "publicada").all()
    # Lógica adicional aqui para mapear 'total_curtidas' e 'comentarios'
    return noticias

@router.post("/", response_model=NoticiaOut)
def criar_noticia(
    noticia: NoticiaCreate, 
    db: Session = Depends(get_db), 
    admin=Depends(get_admin_user) # HU10: Apenas admin
):
    nova_noticia = Noticia(**noticia.dict(), id_usuario=admin.id_usuario)
    db.add(nova_noticia)
    db.commit()
    db.refresh(nova_noticia)
    return nova_noticia

@router.post("/{id_noticia}/curtir")
def curtir_noticia(
    id_noticia: int, 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user) # HU09: Usuário logado
):
    curtida_existente = db.query(Curtida).filter_by(id_noticia=id_noticia, id_usuario=user.id_usuario).first()
    if curtida_existente:
        db.delete(curtida_existente) # Remove a curtida
        db.commit()
        return {"message": "Curtida removida"}
    
    nova_curtida = Curtida(id_noticia=id_noticia, id_usuario=user.id_usuario)
    db.add(nova_curtida)
    db.commit()
    return {"message": "Notícia curtida com sucesso"}