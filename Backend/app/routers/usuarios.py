from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Usuario
from app.schemas.usuario import UsuarioOut, UsuarioUpdate, UsuarioUpdateSenha, UsuarioStatusUpdate
from app.core.security import get_current_active_user, get_current_admin_user, get_password_hash, verify_password
import cloudinary.uploader

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

# ==========================================
# ROTAS DE AUTOGERENCIAMENTO (Meu Perfil)
# ==========================================

@router.get("/me", response_model=UsuarioOut)
def ler_usuario_logado(current_user: Usuario = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=UsuarioOut)
def atualizar_perfil(
    dados: UsuarioUpdate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    if dados.nome:
        current_user.nome = dados.nome
    if dados.email:
        # Verifica se o novo e-mail já está em uso
        email_em_uso = db.query(Usuario).filter(Usuario.email == dados.email).first()
        if email_em_uso and email_em_uso.id_usuario != current_user.id_usuario:
            raise HTTPException(status_code=400, detail="E-mail já está em uso.")
        current_user.email = dados.email
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/foto", response_model=UsuarioOut)
def atualizar_foto_perfil(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    try:
        resultado = cloudinary.uploader.upload(file.file)
        current_user.foto_perfil = resultado.get("secure_url")
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload da imagem: {str(e)}")

@router.put("/me/senha")
def alterar_senha(
    dados: UsuarioUpdateSenha, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    if not verify_password(dados.senha_atual, current_user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    
    current_user.senha_hash = get_password_hash(dados.nova_senha)
    db.commit()
    return {"message": "Senha atualizada com sucesso."}

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def excluir_conta(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    db.delete(current_user)
    db.commit()
    return None

# ==========================================
# ROTAS ADMINISTRATIVAS
# ==========================================

@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), current_admin: Usuario = Depends(get_current_admin_user)):
    usuarios = db.query(Usuario).all()
    return usuarios

@router.put("/{id_usuario}/status", response_model=UsuarioOut)
def alterar_status_usuario(
    id_usuario: int, 
    dados: UsuarioStatusUpdate, 
    db: Session = Depends(get_db), 
    current_admin: Usuario = Depends(get_current_admin_user)
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    usuario.status = dados.status
    db.commit()
    db.refresh(usuario)
    return usuario