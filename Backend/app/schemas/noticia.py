from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ComentarioOut(BaseModel):
    id_comentario: int
    id_usuario: int
    conteudo: str
    data_comentario: datetime
    status: str

    class Config:
        from_attributes = True

class NoticiaBase(BaseModel):
    titulo: str
    conteudo: str
    imagem: Optional[str] = None
    status: str = "publicada"

class NoticiaCreate(NoticiaBase):
    pass

class NoticiaOut(NoticiaBase):
    id_noticia: int
    id_usuario: int
    data_publicacao: datetime
    comentarios: List[ComentarioOut] = []
    total_curtidas: int = 0

    class Config:
        from_attributes = True