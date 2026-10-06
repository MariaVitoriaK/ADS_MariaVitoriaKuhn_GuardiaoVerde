from pydantic import BaseModel, EmailStr
from typing import Optional

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class UsuarioOut(BaseModel):
    id_usuario: int
    nome: str
    email: EmailStr
    tipo_usuario: str
    status: str

    class Config:
        from_attributes = True

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None

class UsuarioUpdateSenha(BaseModel):
    senha_atual: str
    nova_senha: str

class UsuarioStatusUpdate(BaseModel):
    status: str # Ex: "ativo", "bloqueado"