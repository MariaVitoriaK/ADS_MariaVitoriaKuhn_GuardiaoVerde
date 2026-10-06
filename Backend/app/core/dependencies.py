import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Configuração do Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "seu_cloud_name"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "sua_api_key"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "seu_api_secret")
)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: Usuario = Depends(get_current_user)):
    if current_user.status != "ativo":
        raise HTTPException(status_code=400, detail="Usuário inativo ou bloqueado.")
    return current_user

def get_current_admin_user(current_user: Usuario = Depends(get_current_active_user)):
    if current_user.tipo_usuario != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Privilégios de administrador necessários."
        )
    return current_user