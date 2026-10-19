from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ComentarioOut(BaseModel):
    id_comentario: int
    id_usuario: int
    nome_usuario: str
    foto_perfil: Optional[str] = None
    texto: str
    data_comentario: datetime

class ComentarioCreate(BaseModel):
    texto: str = Field(min_length=1, max_length=5000)

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
    comentarios: list[ComentarioOut] = Field(default_factory=list)
    total_comentarios: int = 0
    total_curtidas: int = 0
    curtida_pelo_usuario: bool = False

    class Config:
        from_attributes = True