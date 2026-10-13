from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, usuarios

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

# Registrando as rotas
app.include_router(auth.router)
app.include_router(usuarios.router)

@app.get("/")
def read_root():
    return {"message": "API do Guardião Verde rodando com sucesso!"}