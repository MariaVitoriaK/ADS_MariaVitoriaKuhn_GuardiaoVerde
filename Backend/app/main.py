from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal
from app.models.models import StatusUsuario, TipoUsuario, Usuario
from app.core.security import get_password_hash
from app.routers import auth, noticias, usuarios

app = FastAPI(title="Guardião Verde API", version="1.0.0")
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
            db.add(
                Usuario(
                    nome="Administrador",
                    email="admin@email.com",
                    senha_hash=get_password_hash("admin"),
                    tipo_usuario=TipoUsuario.administrador,
                    status=StatusUsuario.ativo,
                )
            )
            db.commit()
    finally:
        db.close()


ensure_default_admin()

# Registrando as rotas
app.include_router(auth.router)
app.include_router(noticias.router)
app.include_router(usuarios.router)

@app.get("/")
def read_root():
    return {"message": "API do Guardião Verde rodando com sucesso!"}