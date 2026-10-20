from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os
from app.database import get_db
from app.models.models import StatusUsuario, TipoUsuario, Usuario

# Configuração do Passlib para Argon2id
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "uma_chave_secreta_muito_segura")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def authenticate_user(db: Session, email: str, password: str):
    if email.isdigit():
        usuario = db.query(Usuario).filter(Usuario.id_usuario == int(email)).first()
    else:
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario is None or not verify_password(password, usuario.senha_hash):
        return None
    return usuario

def get_current_active_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        if not isinstance(subject, str):
            raise credentials_exception
    except JWTError as error:
        raise credentials_exception from error

    usuario = None
    if "@" in subject:
        usuario = db.query(Usuario).filter(Usuario.email == subject).first()
    else:
        try:
            usuario = db.query(Usuario).filter(Usuario.id_usuario == int(subject)).first()
        except ValueError:
            usuario = None

    if usuario is None:
        raise credentials_exception
    if usuario.status != StatusUsuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo ou bloqueado.",
        )
    return usuario

def get_current_admin_user(
    current_user: Usuario = Depends(get_current_active_user),
):
    if current_user.tipo_usuario != TipoUsuario.administrador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilégios de administrador necessários.",
        )
    return current_user