from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func
from app.database import SessionLocal
from app.models.models import StatusUsuario, TipoUsuario, Usuario
from app.core.security import get_password_hash
from app.routers import auth, denuncias, noticias, usuarios

app = FastAPI(title="Guardião Verde API", version="1.0.0")
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_default_admin() -> None:
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.email == "admin@email.com").first()
        if admin is None:
            username = "admin"
            sufixo = 1
            while db.query(Usuario).filter(func.lower(Usuario.username) == username).first():
                username = f"admin.principal{sufixo}"
                sufixo += 1
            db.add(
                Usuario(
                    nome="Administrador",
                    username=username,
                    email="admin@email.com",
                    senha_hash=get_password_hash("admin"),
                    tipo_usuario=TipoUsuario.administrador,
                    administrador_principal=True,
                    status=StatusUsuario.ativo,
                )
            )
            db.commit()
        elif (
            admin.tipo_usuario != TipoUsuario.administrador
            or not admin.administrador_principal
        ):
            admin.tipo_usuario = TipoUsuario.administrador
            admin.administrador_principal = True
            db.commit()
    finally:
        db.close()


ensure_default_admin()

# Registrando as rotas
app.include_router(auth.router)
app.include_router(denuncias.router)
app.include_router(noticias.router)
app.include_router(usuarios.router)

@app.get("/")
def read_root():
    return {"message": "API do Guardião Verde rodando com sucesso!"}