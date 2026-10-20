# Guardião Verde

## Executar localmente

Inicie a API em um terminal:

```powershell
cd Backend
pip install -r requirements.txt
venv\Scripts\activate
uvicorn app.main:app --reload
```

Inicie o frontend em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

O frontend usa a API em `http://localhost:8000`; configure `DATABASE_URL` no
arquivo `Backend/.env` e garanta que o banco e o schema estejam disponíveis.