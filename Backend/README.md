# Backend - Guardião Verde

API principal do projeto, desenvolvida em FastAPI para autenticação, gestão de usuários, denúncias, notícias, perfis e administração.

## Stack

- Python 3.10+
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL / SQLite compatível
- JWT com `python-jose`
- `passlib[argon2]`
- Upload de arquivos com `python-multipart`

## Estrutura principal

```text
Backend/
├── alembic/
│   ├── env.py
│   ├── README
│   └── versions/
├── app/
│   ├── core/
│   │   ├── dependencies.py
│   │   └── security.py
│   ├── models/
│   │   └── models.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── noticias.py
│   │   └── usuarios.py
│   ├── schemas/
│   │   ├── noticia.py
│   │   ├── token.py
│   │   └── usuario.py
│   ├── database.py
│   ├── main.py
│   └── __init__.py
├── uploads/
│   └── profiles/
├── alembic.ini
├── requirements.txt
├── README.md
└── .env
```

## Requisitos

- Python 3.10+
- Banco configurado em `DATABASE_URL`
- Dependências do arquivo `requirements.txt`

## Variáveis de ambiente

Crie um arquivo `.env` dentro de `Backend/` com o seguinte conteúdo:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/guardiaoverde
SECRET_KEY=sua_chave_secreta_muito_segura
```

Se preferir, ajuste para o banco que estiver usando no ambiente local.

## Instalação

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Execução local

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API ficará disponível em:

- http://localhost:8000
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Usuário administrador padrão

Ao iniciar a aplicação, o sistema cria automaticamente um administrador:

- E-mail: `admin@email.com`
- Senha: `admin`

## Fluxos principais

### Autenticação

- `POST /auth/login`
- `GET /auth/verify-token`

### Usuários

- `POST /usuarios/` cadastro
- `GET /usuarios/me`
- `PUT /usuarios/me`
- `PUT /usuarios/me/foto`
- `PUT /usuarios/me/senha`
- `DELETE /usuarios/me`
- `GET /usuarios/` listagem para admin
- `PUT /usuarios/{id}/status` bloqueio/desbloqueio admin

### Notícias

- `GET /noticias/`
- `GET /noticias/{id_noticia}`
- `POST /noticias/` criação pelo admin
- `POST /noticias/{id}/curtir`
- `POST /noticias/{id}/comentarios`

### Denúncias

A lógica de denúncias é integrada ao domínio do sistema e também utilizada no frontend com o painel administrativo. Há armazenamento de dados, histórico de status e metadata de coordenadas, categoria, cidade e estado.

## Segurança

A autenticação usa JWT com OAuth2. O sistema também valida:

- usuário ativo
- admin permissions
- bloqueio por prazo e desbloqueio automático
- hash de senhas com Argon2

O módulo de segurança em [Backend/app/core/security.py](Backend/app/core/security.py) cuida do login, geração do token, controle de status do usuário e desbloqueio automático quando o prazo expira.

## Banco de dados e migrações

O projeto usa SQLAlchemy e Alembic para versionamento do banco. Para aplicar migrações:

```powershell
cd Backend
alembic upgrade head
```

Se necessário, configure a conexão correta antes de rodar as migrações.

## Uploads

Arquivos enviados pela aplicação são salvos em:

- `Backend/uploads/`
- `Backend/uploads/profiles/`

Esses diretórios devem existir antes de enviar arquivos de perfil ou imagens.

## Dicas de desenvolvimento

- Sempre rode a API com backend ativo antes de validar o frontend.
- Verifique o arquivo [Backend/app/main.py](Backend/app/main.py) para entender a criação do administrador padrão e as rotas registradas.
- Mantenha o ambiente `.env` consistente entre desenvolvimento e produção.
- Antes de entregar mudanças, valide os endpoints mais importantes e os fluxos de autenticação.
