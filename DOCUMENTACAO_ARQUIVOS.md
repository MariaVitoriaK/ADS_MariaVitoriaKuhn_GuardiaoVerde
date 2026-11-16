# Documentação do projeto Guardião Verde

## 1. Visão geral

O Guardião Verde é uma aplicação web para mobilização ambiental e gestão comunitária. O sistema reúne funcionalidades de:

- cadastro e autenticação de usuários
- envio e acompanhamento de denúncias ambientais
- feed de notícias
- perfil de usuário e foto de perfil
- área administrativa para gerenciamento de usuários e denúncias
- conexão com ONGs e campanhas de mobilização

A estrutura do projeto é um monorepo com duas partes principais:

- Backend: API em FastAPI
- Frontend: interface em React + TypeScript + Vite

---

## 2. Arquitetura geral

O projeto segue uma arquitetura simples e funcional para MVP:

1. O usuário acessa o frontend.
2. O frontend realiza requisições para o backend via Axios.
3. O backend valida autenticação, permissões e regras de negócio.
4. Os dados são persistidos em banco relacional usando SQLAlchemy.
5. O frontend exibe os dados e permite ações do usuário e do administrador.

O fluxo principal de negócio é o de denúncia ambiental, que passa por:

- formulário no frontend
- persistência local no frontend para UX e fallback
- envio para API do backend
- registro no banco
- criação de histórico de status
- administração pelo painel
- atualização do status e notificação por e-mail

---

## 3. Estrutura de pastas

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
│   ├── README.md
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── README.md
├── README.md
├── DOCUMENTACAO_ARQUIVOS.md
└── .gitignore
```

---

## 4. Backend: arquivos e função

### Backend/app/main.py

Arquivo principal da API.

Funções:

- cria a instância do FastAPI
- monta o diretório de uploads para arquivos de perfil ou notícias
- habilita CORS para o frontend em localhost
- registra os routers de autenticação, denúncias, notícias e usuários
- garante que um administrador padrão exista ao iniciar a API

Fluxo:

1. a aplicação sobe
2. `ensure_default_admin()` verifica se existe usuário administrador
3. se não existir, cria `admin@email.com` com senha `admin`
4. os routers são carregados e as rotas ficam disponíveis

Observação importante: esse arquivo é o ponto de entrada da API e define o comportamento inicial do sistema.

### Backend/app/database.py

Arquivo responsável por configurar a conexão com o banco.

Funções:

- define a base declarativa do SQLAlchemy
- cria a sessão de banco (`SessionLocal`)
- expõe `get_db()` para injeção de dependência nas rotas

Fluxo:

- cada rota depende de `get_db`
- a sessão é aberta e usada ao atender a requisição
- ao fim, a sessão é fechada

Esse arquivo é o “elo” entre FastAPI e o banco relacional.

### Backend/app/core/security.py

Centraliza segurança, autenticação e autorização.

Funções principais:

- configuração do `CryptContext` para hash de senha com Argon2
- geração e validação de JWT
- autenticação do usuário ativo
- bloqueio e desbloqueio automático por prazo
- verificação de privilégio de administrador

Fluxo:

1. o usuário faz login em `/auth/login`
2. o sistema valida e-mail e senha
3. gera um token JWT
4. em cada rota protegida, o token é lido e validado
5. o usuário só pode acessar recursos permitidos ao seu perfil

Ponto de atenção: a chave secreta usa fallback (`SECRET_KEY` com valor padrão), o que não é recomendado para produção.

### Backend/app/routers/auth.py

Rota de autenticação.

Endpoints principais:

- `POST /auth/login`
- `GET /auth/verify-token`

Fluxo:

- usuário envia e-mail e senha
- backend valida credenciais
- checa se a conta está ativa
- retorna o token JWT

Esse módulo é a porta de entrada da sessão do usuário.

### Backend/app/routers/usuarios.py

Módulo do gerenciamento de usuários.

Ele cuida de:

- cadastro de usuário comum
- criação de administrador secundário
- leitura do perfil do usuário logado
- atualização de perfil, foto, senha e status
- bloqueio de contas
- verificação de e-mail
- gestão administrativa

Fluxo principal:

- o usuário cria conta
- o backend valida username, e-mail e regras de integridade
- o usuário pode validar e-mail
- o admin pode bloquear, ativar ou remover perfis

Esse arquivo também é importantíssimo para a lógica de segurança e autorização da aplicação.

### Backend/app/routers/denuncias.py

Este é o módulo mais importante para o fluxo de denúncia.

Responsabilidades:

- listar denúncias
- listar as denúncias do usuário autenticado
- criar denúncia
- alterar o status da denúncia
- registrar histórico da mudança
- disparar notificação por e-mail quando status muda

Fluxo principal da denúncia:

1. Usuário acessa o frontend e preenche formulário.
2. O frontend cria um objeto de denúncia e salva localmente (fallback) ou envia para a API.
3. O backend recebe o payload em `criar_denuncia()`.
4. O backend valida título e descrição.
5. Cria a instância de `Denuncia` com os campos principais.
6. Salva no banco.
7. Cria um registro em `HistoricoDenuncia` com a observação:
   `Denúncia registrada e encaminhada para o administrador.`
8. A denúncia fica com status inicial `pendente`.
9. O administrador acessa o painel de denúncias.
10. O admin altera o status para `aceita`, `em_andamento`, `resolvida` ou `recusada`.
11. O backend grava o histórico com `status_anterior`, `novo_status` e `observacao`.
12. Se o e-mail do usuário estiver verificado, dispara e-mail de atualização.

End points relevantes:

- `GET /denuncias/`
- `GET /denuncias/me`
- `POST /denuncias/`
- `POST /denuncias/{id_denuncia}/status`
- `POST /denuncias/me/verificar-email`

Observação: há uma diferença importante entre a experiência do frontend e o backend real:

- o frontend usa dados locais em `localStorage` para simulação
- o backend é a fonte real de dados e persistência

Esse dualismo precisa ser documentado para evitar confusão de manutenção.

### Backend/app/models/models.py

Define os modelos do banco com SQLAlchemy.

Entidades principais:

- `Usuario`
- `Denuncia`
- `HistoricoDenuncia`
- `Foto`
- `Noticia`
- `Comentario`
- `Curtida`
- `ONG`

Modelos relevantes para denúncias:

#### `Usuario`

Armazena dados de autenticação e perfil do usuário, além de status e permissões.

#### `Denuncia`

Representa a denúncia ambiental:

- id da denúncia
- id do usuário autor
- título e descrição
- categoria
- localizacao, cidade, estado
- coordenadas
- data da ocorrência
- gravidade
- status
- data do registro

#### `HistoricoDenuncia`

Registro do ciclo de vida da denúncia.

Ele guarda:

- status anterior
- novo status
- observação
- quem alterou
- data da alteração

Esse histórico é essencial para auditoria e rastreabilidade das decisões administrativas.

### Backend/app/services/email_service.py

Responsável por enviar e-mails do sistema.

Funções relevantes:

- envio de confirmação de e-mail
- envio de atualização de status de denúncia
- envio de mensagens administrativas

Fluxo:

- o backend monta o conteúdo do e-mail
- usa SMTP para entregar a mensagem
- se a conta do usuário está verificada, a atualização pode ser enviada com sucesso

### Backend/app/routers/noticias.py

Administra o feed de notícias.

Funções:

- listagem de notícias
- detalhes da notícia
- criação de notícia pelo administrador
- curtidas
- comentários

Não é o foco principal do fluxo de denúncia, mas faz parte do ecossistema da aplicação.

---

## 5. Frontend: arquivos e função

### frontend/src/services/api.ts

Cliente HTTP central do projeto.

Funções:

- cria uma instância do Axios
- usa `baseURL: http://localhost:8000`
- adiona o token JWT automaticamente em requisições autenticadas
- exporta funções para login, usuários, denúncias e notícias

Esse arquivo é a ponte entre interface e backend.

### frontend/src/contexts/AuthContext.tsx

Contexto de autenticação do React.

Responsabilidades:

- guardar token e usuário no `localStorage`
- disponibilizar `login`, `logout` e `updateUser`
- identificar se o usuário é admin
- controlar acesso às rotas privadas

Esse módulo centraliza o estado de sessão do usuário.

### frontend/src/routes/AppRoutes.tsx

Define as rotas da aplicação.

Rotas públicas:

- `/login`
- `/cadastro`

Rotas privadas:

- `/home`
- `/perfil`
- `/dashboard`
- `/denunciar`
- `/ongs`
- `/noticias/:id`

Rotas administrativas:

- `/admin`
- `/admin/denuncias`
- `/admin/relatorios`

### frontend/src/pages/DenunciarPage.tsx

Página principal de envio de denúncia pelo usuário.

Funções:

- formulário com categoria, cidade, estado, gravidade, descrição, data e coordenadas
- seleção no mapa para identificar a ocorrência
- upload de fotos
- validação de campos
- criação da denúncia com status inicial `pendente`
- armazenamento local em `localStorage` para UX e fallback

Fluxo da denúncia na interface:

1. o usuário escolhe categoria e localização
2. preenche descrição e dados da ocorrência
3. seleciona o mapa para coordenadas
4. envia o formulário
5. o denúncia é salva em memória/localStorage
6. o item aparece na lista do usuário

Importante: esse arquivo mostra a experiência do usuário mais diretamente, porém a fonte real de dados continua sendo o backend.

### frontend/src/data/denuncias.ts

Arquivo que define o modelo local de denúncia e o armazenamento em `localStorage`.

Funções:

- define `DenunciaStatus`
- define interface `Denuncia`
- define `statusLabels`
- salva e lê registros de denúncias no navegador
- cria histórico inicial de mudanças

Observação importante:

- esse arquivo representa um “mock local” para a UI
- ele não substitui o banco real do backend
- é útil para desenvolvimento e UX, mas deve ser usado com cuidado

### frontend/src/pages/AdminDenunciasPage.tsx

Dashboard administrativo para análise de denúncias.

Funções:

- busca e lista denúncias recebidas
- filtra por status e conteúdo
- permite transições de status
- registra observação do administrador
- atualiza a denúncia no frontend e chama a API do backend

Fluxo administrativo:

1. admin entra na página
2. carrega denúncias do backend
3. escolhe uma denúncia
4. altera o status
5. grava observação
6. o sistema salva o histórico e atualiza a interface

### frontend/src/pages/AdminPanel.tsx e AdminReportsPage.tsx

São páginas de gestão da área administrativa.

- `AdminPanel`: painel geral de gestão
- `AdminReportsPage`: relatórios, métricas e visão do administrador

Essas páginas complementam a operação do fluxo de denúncias e ajudam na supervisão geral.

### frontend/src/pages/Login.tsx, Cadastro.tsx, Perfil.tsx, Dashboard.tsx

Esses arquivos tratam da experiência do usuário:

- login
- cadastro
- perfil
- dashboard geral
- acesso às ações disponíveis

---

## 6. Fluxo completo de denúncia

### Fluxo do usuário

1. usuário acessa `/denunciar`
2. preenche formulário
3. informa categoria, cidade, descrição, data e coordenadas
4. envia denúncia
5. estado inicial passa para `pendente`
6. o historico inicial é registrado

### Fluxo administrativo

1. admin acessa `/admin/denuncias`
2. lista denúncias e filtros
3. escolhe status final
4. confirma a alteração
5. o backend atualiza o registro no banco
6. o histórico guarda a mudança
7. o usuário pode receber notificação por e-mail

### Fluxo de persistência

- Frontend: localStorage + UX local
- Backend: banco relacional + SQLAlchemy + histórico de status
- Mensagens e-mails: disparadas por SMTP

Esse fluxo é o coração do sistema, e a clareza dessa cadeia é crucial para manutenção e evolução do projeto.

---

## 7. O que pode melhorar no projeto

### 7.1 Padronização

- padronizar nomes de arquivos e documentação (`README.md` em vez de `Readme.md`)
- manter uma convenção de pastas e instruções iguais em todas as áreas
- remover duplicação de documentação em três README diferentes

### 7.2 Segurança

- remover fallback de `SECRET_KEY` fraco
- ajustar credenciais padrão do administrador para produção
- validar melhor ambiente de desenvolvimento e produção
- evitar hardcoded `localhost` em partes da aplicação

### 7.3 Ambiente e setup

- padronizar `requirements.txt`, `package.json`, ambiente virtual e versões
- incluir `pytest` como dependência de desenvolvimento
- documentar melhor `DATABASE_URL`, `SMTP_*` e outros parâmetros de ambiente
- centralizar `.env.example` e cotas de configuração

### 7.4 Manutenção

- separar melhor dados de mock/localStorage do backend real
- documentar claramente onde o sistema está em simulação e onde está em produção
- melhorar a camada de validação e mensagens de erro

### 7.5 Escalabilidade

- migrar parte do armazenamento local para backend consistente e unificado
- reforçar regras de business logic em schemas e validações de API
- padronizar resposta de APIs e tratamentos de erro

---

## 8. Conclusão

O projeto já apresenta uma boa base funcional para um MVP. A principal área de melhoria não é a ausência de funcionalidade, e sim a organização, a padronização e a clareza do fluxo de negócio.

O fluxo de denúncia está bem compreensível e está funcional, mas o sistema ainda mistura:

- frontend local de experiência
- backend real de persistência
- administração de status e histórico
- notificações por e-mail

Com uma documentação mais clara e uma padronização melhor de nomes e ambiente, o projeto fica muito mais fácil de manter e evoluir.
