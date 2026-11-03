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

---


readme, 

sistema de pesquisa e filtro no admin panel e no denunciar, 
metricas na pagina de denuncias o admin mostrando as denuncias conluidas aceitas ou pendentes, 
username do usuário, 
Validação Automática de Denúncias,
metrica de usuarios que mais denunciaram (denuncias aceitas),
Sistema de doações,
Notificações em Tempo Real (WebSockets)(por exemplo, enquanto o user esta no site, notifica sobre novas noticias ou mudança nas denuncias do user especifico),
relatorios para o admin (uma pagina),
no adicionar noticias, mudar a imagem por url para imagem no pc,