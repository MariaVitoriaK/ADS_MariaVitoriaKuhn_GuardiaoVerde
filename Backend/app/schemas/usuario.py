from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.models import StatusUsuario, TipoUsuario

class UsuarioCreate(BaseModel):
    nome: str
    username: str
    email: EmailStr
    senha: str

class UsuarioAdminCreate(BaseModel):
    nome: str
    username: str
    email: EmailStr
    senha: str = Field(min_length=8)

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class UsuarioOut(BaseModel):
    id_usuario: int
    nome: str
    username: str
    email: EmailStr
    tipo_usuario: TipoUsuario
    administrador_principal: bool = False
    status: StatusUsuario
    bloqueado_ate: Optional[datetime] = None
    foto_perfil: Optional[str] = None

    class Config:
        from_attributes = True

class UsuarioPerfilAtualizado(UsuarioOut):
    access_token: str

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class UsuarioUpdateSenha(BaseModel):
    senha_atual: str
    nova_senha: str

class UsuarioStatusUpdate(BaseModel):
    status: str
    duracao: Optional[str] = None