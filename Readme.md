*AVISO:* Alguns commit estão com o username de outros alunos, mesmo que eu tenha commitado, porque foi utilizado o pc da faculdade.

# Guardião Verde

Aplicação web para mobilização ambiental e gestão de denúncias, notícias e relacionamento com ONGs. O sistema permite que usuários enviem denúncias, acompanhem notícias, interajam com conteúdos e que administradores gerenciem usuários, bloqueios e relatórios.

## Visão geral

O projeto é um monorepo com duas partes principais:

- Backend: API em FastAPI com autenticação JWT, autorização por perfil, modelos de domínio, uploads e lógica administrativa.
- Frontend: interface em React + TypeScript + Vite + Material UI para acesso ao dashboard, denúncia, feed de notícias, perfil e administração.

## Stack principal

- Backend: Python 3, FastAPI, SQLAlchemy, Alembic, PostgreSQL/SQLite compatível e JWT
- Frontend: React 19, TypeScript, Vite, Material UI, Axios
- Autenticação: OAuth2 com token JWT
- Uploads: arquivos de perfil e imagens de notícias armazenados em `Backend/uploads`

## Estrutura do projeto

```text
GuardiaoVerde/
├── Backend/
│   ├── alembic/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   ├── uploads/
│   ├── requirements.txt
│   └── alembic.ini
├── Frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.*
├── Readme.md
└── .gitignore
```

## Requisitos

- Python 3.10+
- Node.js 18+
- npm
- Banco PostgreSQL configurado via `DATABASE_URL` (ou ajuste conforme o ambiente local)

## Variáveis de ambiente

Crie um arquivo `Backend/.env` com algo semelhante:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/guardiaoverde
SECRET_KEY=sua_chave_secreta_muito_segura
```

Se o banco ainda não existir, crie-o antes de iniciar a API.

## Execução rápida

### 1) Backend

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m pip install "psycopg[binary]==3.3.8"
uvicorn app.main:app --reload
```

A API ficará disponível em:

- http://localhost:8000
- Documentação Swagger em http://localhost:8000/docs

### 2) Frontend

Em outro terminal:

```powershell
cd Frontend
npm install
npm run dev
```

O frontend fica em:

- http://localhost:5173

## Usuário administrador padrão

Ao iniciar a API, o sistema cria automaticamente um administrador padrão:

- E-mail: `admin@email.com`
- Senha: `admin`

## Funcionalidades principais

- Cadastro e autenticação de usuários
- Bloqueio temporário ou permanente de contas com desbloqueio automático ao expirar o prazo
- Cadastro de denúncias com categoria, cidade, estado, data e coordenadas
- Feed de notícias com curtidas e comentários
- Administração de usuários e denúncias
- Relatórios do administrador com métricas gerais
- Gestão de perfis, fotos e senha
- Página de ONGs e fluxo de mobilização comunitária

## Observações importantes

- O frontend envia requisições para `http://localhost:8000` por padrão em [Frontend/src/services/api.ts](Frontend/src/services/api.ts).
- Arquivos de upload ficam em `Backend/uploads` e os perfis em `Backend/uploads/profiles`.
- Antes de rodar a aplicação em ambiente real, valide a conexão com o banco e as migrations do Alembic.

## Comandos úteis

### Backend

```powershell
cd Backend
python -m pytest
```

### Frontend

```powershell
cd Frontend
npm run build
npm run preview
```

---

Este projeto foi desenvolvido como uma plataforma de engajamento ambiental e gestão comunitária, com foco em denúncias, educação e ação social.

---

arrumar o fluxo em denuncias,
Adicionar mais administradores e nomear quem fez qual mudança,


mandar um email para o usuario para receber atualizacoes sobre sua denuncia.
curtir comentarios.

