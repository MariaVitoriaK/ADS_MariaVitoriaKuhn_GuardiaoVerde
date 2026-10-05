from fastapi import FastAPI
from app.routers import auth, usuarios

app = FastAPI(title="Guardião Verde API", version="1.0.0")

# Registrando as rotas
app.include_router(auth.router)
app.include_router(usuarios.router)

@app.get("/")
def read_root():
    return {"message": "API do Guardião Verde rodando com sucesso!"}