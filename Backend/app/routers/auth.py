from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.models import Usuario
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])

class RecuperarSenhaRequest(BaseModel):
    email: EmailStr

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # O OAuth2PasswordRequestForm usa 'username' por padrão, então passamos o e-mail nele
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    
    # Verifica se o usuário existe e se a senha está correta (Regra de Negócio 1, 2 e 3)
    if not user or not verify_password(form_data.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Gera o Token JWT
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout():
    # O logout real ocorre no frontend ao apagar o token do localStorage
    return {"message": "Logout realizado com sucesso."}

@router.post("/recuperar-senha")
def recuperar_senha(request: RecuperarSenhaRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == request.email).first()
    # Retornamos sucesso genérico por segurança (para não revelar se o e-mail existe na base)
    if not user:
        return {"message": "Se o e-mail existir, um link de recuperação será enviado."}
    
    # Aqui futuramente entra a lógica de envio de e-mail com SMTP
    return {"message": "Se o e-mail existir, um link de recuperação será enviado."}