from fastapi import FastAPI
from app.database import Base, engine

# Cria as tabelas diretamente (opcional, já que vamos usar Alembic, mas útil para testes imediatos)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Guardião Verde API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "API do Guardião Verde rodando com sucesso!"}