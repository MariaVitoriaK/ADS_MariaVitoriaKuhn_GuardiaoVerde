from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import authenticate_user, create_access_token, get_current_active_user
from app.schemas.token import Token
from app.models.models import Usuario

router = APIRouter(tags=["Autenticação"])

@router.post("/login", response_model=Token)
def login_para_obter_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # authenticate_user deve verificar o hash da senha (criado na semana 2)
    usuario = authenticate_user(db, form_data.username, form_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Bloqueio de utilizadores inativos/bloqueados no login
    if usuario.status != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta inativa ou bloqueada pelo administrador."
        )

    access_token = create_access_token(data={"sub": usuario.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/verify-token")
def verificar_token(current_user: Usuario = Depends(get_current_active_user)):
    # Utiliza get_current_active_user para garantir que um token válido 
    # de um usuário recém-bloqueado seja rejeitado.
    return {"message": "Token válido", "usuario": current_user.email}