# Documentação dos arquivos importantes do projeto

Este documento explica com profundidade a função de cada arquivo principal do projeto, focando especialmente em:

- `Backend/app` — camada de API, regras de negócio, autenticação e modelos do banco
- `Frontend/src` — interface do usuário, rotas, contexto de autenticação e páginas do sistema

O objetivo é ajudar qualquer pessoa que entre no código a entender rapidamente o que cada parte faz, sem precisar ler todo o projeto de forma aleatória.

---

## Visão geral da arquitetura

O projeto segue uma divisão clara entre:

1. Backend em Python/FastAPI
   - define os modelos do banco
   - expõe endpoints HTTP
   - valida autenticação e autorização
   - processa regras de negócio (bloqueio, curtidas, denúncias, notícias)

2. Frontend em React + TypeScript
   - renderiza a interface do usuário
   - guarda login do usuário no contexto
   - chama a API
   - organiza as páginas, rotas e regras de acesso

Em termos práticos:

- o backend é o “motor” do sistema
- o frontend é a camada visual e interativa
- o banco de dados armazena os dados reais
- a comunicação entre os dois acontece via chamadas HTTP (Axios/Fetch)

---

# Backend/app

A pasta `Backend/app` é o coração da API. Ela reúne tudo que o backend precisa para funcionar.

## 1) `Backend/app/main.py`

Arquivo principal da aplicação FastAPI.

### Função
- cria a instância do app com `FastAPI()`
- habilita CORS para permitir que o frontend acesse a API em localhost
- monta a pasta de uploads para servir arquivos de imagem
- registra todos os routers (rotas da API)
- garante que exista um usuário administrador padrão ao iniciar a aplicação

### O que acontece nele

```python
app = FastAPI(title="Guardião Verde API", version="1.0.0")
```

Isso define o nome e a versão da API.

A configuração do CORS é importante porque o frontend roda em `http://localhost:5173` e a API roda em `http://localhost:8000`. Sem isso, o navegador bloqueia requisições entre domínios diferentes.

```python
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
```

Esse trecho disponibiliza arquivos salvos na pasta `uploads` para que a aplicação possa acessar imagens públicas, como fotos de perfil ou imagens de notícias.

A função `ensure_default_admin()` verifica se já existe o e-mail `admin@email.com`. Se não existir, cria um administrador padrão com:

- nome: `Administrador`
- e-mail: `admin@email.com`
- senha: `admin`

Esse procedimento é útil para facilitar o primeiro acesso ao painel administrativo.

Também são incluídos os routers:

- `auth.router`
- `noticias.router`
- `usuarios.router`

Ou seja, o app conecta as rotas de autenticação, notícias e usuários em um único sistema.

---

## 2) `Backend/app/database.py`

Arquivo de configuração do banco de dados.

### Função
- carrega a variável de ambiente `DATABASE_URL`
- cria a engine SQLAlchemy
- cria a sessão do banco (`SessionLocal`)
- define `Base` como base para todos os modelos do SQLAlchemy
- expõe a função `get_db()` para injetar sessões nas rotas

### O que ele faz na prática

```python
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
```

Aqui a aplicação conecta ao banco de dados configurado. Essa URL normalmente é algo como PostgreSQL, mas o projeto também pode funcionar em outros ambientes compatíveis com SQLAlchemy.

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Essa função é usada em cada rota do FastAPI. Fundamentamente, ela abre uma sessão de banco, usa essa sessão durante a requisição e a fecha ao final. Isso evita vazamento de conexão e torna o código organizado.

---

## 3) `Backend/app/models/models.py`

Arquivo central do modelo de dados.

### Função
Define todas as tabelas do banco usando SQLAlchemy. Cada classe representa uma tabela, e cada atributo representa uma coluna.

### Modelos principais

#### `TipoUsuario`
Enum para distinguir:
- `usuario`
- `administrador`

#### `StatusUsuario`
Enum para distinguir:
- `ativo`
- `inativo`
- `banido`

#### `Usuario`
Tabela principal do sistema.

Campos importantes:
- `id_usuario`
- `nome`
- `email`
- `senha_hash`
- `foto_perfil`
- `tipo_usuario`
- `status`
- `bloqueado_ate`
- `data_cadastro`

Essa tabela representa o usuário cadastrado no sistema, incluindo papel administrativo e bloqueio por tempo.

#### `Denuncia`
Tabela responsável pelas denúncias registradas.

Campos principais:
- `titulo`
- `descricao`
- `categoria`
- `cidade`
- `estado`
- `latitude`
- `longitude`
- `data_ocorrencia`
- `gravidade`
- `status`
- `data_registro`

Essa tabela guarda o caso reportado pela comunidade e é a base do fluxo administrativo.

#### `HistoricoDenuncia`
Registra o histórico de alterações de status da denúncia.

Exemplo:
- pendente → aceita
- aceita → em andamento
- em andamento → resolvida

Isso é importante para auditoria e para manter um acompanhamento da evolução do caso.

#### `Noticia`
Tabela para as notícias publicadas.

Campos principais:
- `titulo`
- `conteudo`
- `imagem`
- `data_publicacao`
- `status`

Ela sustenta o feed do sistema.

#### `Comentario`
Tabela para comentários feitos em notícias.

Ele guarda:
- `id_usuario`
- `id_noticia`
- `texto`
- `data_comentario`
- `status`

#### `Curtida`
Representa a curtida de um usuário em uma notícia.

Guarda:
- `id_usuario`
- `id_noticia`
- `data_curtida`

Essa tabela é importante para evitar que o usuário curta a mesma notícia múltiplas vezes e para calcular a quantidade de curtidas por publicação.

#### `ONG`
Tabela de organizações parceiras ou instituições cadastradas.

Campos principais:
- `nome`
- `descricao`
- `area_atuacao`
- `site`
- `link_doacao`
- `redes_sociais`
- `status`

Ela sustenta a página/fluxo de ONGs no frontend.

---

## 4) `Backend/app/core/security.py`

Arquivo de segurança e autenticação.

### Função
centraliza login, hash de senha, geração de tokens JWT e verificação de permissões.

### Componentes principais

#### `get_password_hash(password: str)`
Cria o hash da senha usando Argon2.

Isso garante que a senha do usuário não fique em texto puro no banco.

#### `verify_password(plain_password, hashed_password)`
Compara uma senha digitada pelo usuário com o hash salvo.

#### `create_access_token(data: dict)`
Gera um token JWT para autenticar o usuário depois do login.

Esse token é enviado no header `Authorization` em requisições protegidas.

#### `atualizar_status_bloqueio_automatico(db, usuario)`
Verifica se o prazo de bloqueio já expirou. Se sim:
- muda o status para `ativo`
- remove `bloqueado_ate`
- salva no banco

Esse comportamento permite que um usuário bloqueado por 30 ou 90 dias seja desbloqueado automaticamente quando o tempo passar.

#### `authenticate_user(db, email, password)`
Busca o usuário no banco e valida a senha. Se usuário e senha forem corretos, retorna o usuário autenticado.

#### `get_current_active_user(...)`
Leitura crucial do sistema.

Ela:
- recebe o token JWT
- decodifica o token
- busca o usuário correspondente
- verifica se o usuário ainda está ativo
- rejeita acessos se ele estiver bloqueado ou inativo

#### `get_current_admin_user(...)`
Valida se o usuário autenticado tem permissão de administrador.

Se não tiver, bloqueia a rota com erro `403 Forbidden`.

---

## 5) `Backend/app/core/dependencies.py`

Arquivo simples, mas importante.

### Função
Expõe as dependências principais de autenticação para uso em outros módulos do backend.

Ele apenas importa e reexporta funções do módulo `security.py` com `__all__`.

Ou seja, ele serve como uma camada central de acesso rápido para:

- `authenticate_user`
- `get_current_active_user`
- `get_current_admin_user`
- `oauth2_scheme`

Isso ajuda a manter importações mais organizadas em diferentes routers.

---

## 6) `Backend/app/routers/auth.py`

Arquivo responsável pelas rotas de autenticação.

### Função
- login do usuário
- verificação de token

### Endpoints principais

#### `POST /auth/login`
Recebe os dados de login no formato do OAuth2 (`username` e `password`).

Fluxo:
1. busca o usuário pelo e-mail
2. valida a senha
3. verifica se a conta está ativa
4. gera um token JWT
5. retorna o token para o frontend

Se houver erro de credencial ou conta bloqueada, retorna `401` ou `403`.

#### `GET /auth/verify-token`
Valida um token já enviado pelo frontend. Se for válido, responde positivo. Se não for, rejeita.

Essa rota é importante para garantir que o frontend não continue autenticado com um token inválido.

---

## 7) `Backend/app/routers/usuarios.py`

Arquivo com as regras e endpoints de usuários.

### Função
Gerencia cadastro, perfil, exclusão de conta, bloqueio de usuário e administração.

### Partes importantes

#### `criar_usuario()`
Cria um novo usuário no sistema.

Valida:
- email já existente
- dados obrigatórios
- senha segura e armazenada como hash

#### `ler_usuario_logado()`
Retorna os dados do usuário autenticado.

Usado pelo frontend para carregar informações do perfil.

#### `atualizar_perfil()`
Permite alterar nome e e-mail do usuário logado.

#### `atualizar_foto_perfil()`
Recebe um arquivo de imagem, valida o tipo e o tamanho, salva em `uploads/profiles` e atualiza o campo `foto_perfil` do usuário.

#### `alterar_senha()`
Valida a senha atual e troca pela nova senha.

#### `remover_curtidas_do_usuario()`
Função auxiliar que remove curtidas antes de excluir o usuário.

Isso resolve um problema crítico do sistema: quando um usuário é deletado, suas curtidas também precisam ser removidas antes do `delete`, para não quebrar integridade referencial.

#### `excluir_conta()`
Exclui o usuário logado.

Antes disso, chama a função de remoção das curtidas.

#### `listar_usuarios()`
Lista todos os usuários. Essa rota é restrita a administradores.

#### `alterar_status_usuario()`
Rota de administração para:
- ativar usuário
- inativar usuário
- banir usuário por 30 dias, 90 dias ou permanentemente

Essa rota também ajusta o campo `bloqueado_ate` e dispara a lógica de desbloqueio automático.

---

## 8) `Backend/app/routers/noticias.py`

Arquivo que cuida do feed e da lógica de notícias.

### Função
- listar notícias públicas
- buscar notícia individual
- criar notícia (somente admin)
- curtir notícia
- comentar notícia

### Função `serializar_noticia()`
Transforma o objeto da model em um formato serializável para o frontend. Ela inclui:
- id
- título
- conteúdo
- imagem
- data
- total de curtidas
- total de comentários
- se o usuário atual curtiu a notícia

### `listar_noticias()`
Busca todas as notícias públicas e calcula:
- quantas curtidas cada uma tem
- quantos comentários cada uma tem
- se o usuário logado curtiu a notícia

### `obter_noticia()`
Busca uma notícia específica e também retorna os comentários associados.

### `criar_noticia()`
Cria uma notícia no banco. Só um administrador pode fazer isso.

### `curtir_noticia()`
Alterna a curtida:
- se o usuário já curtiu, remove
- se não curtiu, adiciona

A resposta inclui o novo total de curtidas.

### `comentar_noticia()`
Cria um comentário para uma notícia, validando que o texto não esteja vazio.

---

## 9) `Backend/app/schemas/*.py`

A pasta `schemas` contém os modelos de entrada e saída da API, usados para validar os dados recebidos e retornados.

### `token.py`
Define a estrutura do payload do token.

Exemplo:

- `access_token`
- `token_type`

### `usuario.py`
Define modelos como:

- `UsuarioCreate`
- `UsuarioOut`
- `UsuarioUpdate`
- `UsuarioUpdateSenha`
- `UsuarioStatusUpdate`

Esses schemas garantem que o frontend envie e receba dados com a estrutura correta.

### `noticia.py`
Define os schemas para notícias e comentários.

Ele valida o conteúdo enviado para criação de notícia e o retorno com listagem de comentário, curtida e dados da publicação.

Em resumo: `schemas` é a camada de contrato da API.

---

# Frontend/src

A pasta `Frontend/src` é a parte visual do sistema. Ela organiza interface, estados, rotas e comunicação com a API.

## 1) `Frontend/src/main.tsx`

Arquivo de bootstrap da aplicação React.

### Função
- monta a aplicação na página HTML
- envolve tudo em `<React.StrictMode>`
- envolve a aplicação com `AuthProvider`
- renderiza `<App />`

### Importância
É o ponto de entrada do frontend. Sem esse arquivo, a aplicação não aparece na tela.

---

## 2) `Frontend/src/App.tsx`

Arquivo principal da camada de renderização.

### Função
- aplica `CssBaseline` para resetar estilos padrão do navegador
- chama `AppRoutes` para renderizar as rotas da aplicação

Em projetos React é comum esse arquivo conter a estrutura principal do app, e aqui ele fica bem mínimo, exatamente como a arquitetura do projeto foi organizada.

---

## 3) `Frontend/src/contexts/AuthContext.tsx`

Arquivo que guarda o estado da autenticação no frontend.

### Função
controla:
- se o usuário está autenticado
- quem é o usuário
- se é admin
- login
- logout
- atualização dos dados do usuário

### O que ele faz na prática

- lê o token salvo em `localStorage`
- lê o usuário salvo em `localStorage`
- usa esse estado para permitir acesso às rotas privadas
- marca `isAdmin` quando o e-mail do usuário é `admin@email.com`

Esse contexto é essencial porque várias telas dependem do estado de autenticação.

---

## 4) `Frontend/src/routes/AppRoutes.tsx`

Arquivo central de navegação da aplicação.

### Função
define todas as rotas do frontend e quais páginas são públicas ou privadas.

### Estrutura

- rotas públicas:
  - `/login`
  - `/cadastro`
  - `/`

- rotas privadas para qualquer usuário autenticado:
  - `/home`
  - `/perfil`
  - `/dashboard`
  - `/denunciar`
  - `/ongs`
  - `/noticias/:id`

- rotas privadas só para admin:
  - `/admin`
  - `/admin/denuncias`
  - `/admin/relatorios`

A navegação é controlada por `PrivateRoute.tsx`.

---

## 5) `Frontend/src/routes/PrivateRoute.tsx`

Componente de proteção de rotas.

### Função
- se o usuário não está logado, redireciona para `/login`
- se a rota é `adminOnly` e o usuário não é admin, redireciona para `/dashboard`
- caso contrário, renderiza a rota solicitada

Isso garante que partes sensíveis da aplicação não sejam acessíveis por qualquer usuário.

---

## 6) `Frontend/src/services/api.ts`

Arquivo de cliente HTTP do frontend.

### Função
cria a instância do Axios com base URL em `http://localhost:8000`.

Ele também adiciona automaticamente o token JWT no header `Authorization` para cada requisição.

### O que ele encapsula
- `getCurrentUser()`
- `updateProfile()`
- `updatePassword()`
- `deleteAccount()`
- `getUsers()`
- `updateUserStatus()`

Esse arquivo é a ponte entre o frontend e a API. Ele centraliza a comunicação HTTP para evitar repetição e reduzir erros.

---

## 7) `Frontend/src/services/noticias.ts`

Arquivo específico para operações relacionadas a notícias.

### Função
encapsula chamadas da API para:
- listar notícias
- buscar notícia por id
- criar notícia
- curtir notícia
- criar comentário

Esse arquivo mantém o código mais organizado e deixa os componentes de página mais limpos.

---

## 8) `Frontend/src/data/denuncias.ts`

Arquivo responsável por definir o formato e o armazenamento local das denúncias no frontend.

### Função
- define tipos e interfaces (
  `Denuncia`, `HistoricoDenuncia`, `DenunciaStatus`)
- define labels de status em texto (`Pendente`, `Aceita`, etc.)
- cria histórico de alteração de status
- lê e salva denúncias no `localStorage`

### Por que isso existe
Mesmo com a API existindo, a aplicação usa localStorage para persistir dados de denúncia em algumas interações do frontend. Isso melhora a experiência em fluxo de admin e teste local sem depender de backend em alguns casos.

Esses utilitários servem como uma camada de armazenamento temporário e de controle de estado do front.

---

## 9) `Frontend/src/components/Layout.tsx`

Componente estrutural da navegação base.

### Função
monta o layout visual geral da aplicação:
- AppBar superior
- espaço de conteúdo principal
- `Outlet` para renderizar as páginas conforme rota

Esse é um componente reutilizado pela aplicação para manter padronização visual.

---

## 10) `Frontend/src/pages/`

A pasta de páginas contém as telas da aplicação. Cada arquivo representa uma rota ou parte funcional do sistema.

### Páginas principais

#### `Login.tsx`
Tela de autenticação.

- login de usuário
- gerenciamento do token
- redirecionamento ao dashboard após autenticação

#### `Cadastro.tsx`
Tela de cadastro de usuários.

- coleta nome, e-mail e senha
- envia dados para `/usuarios/`
- redireciona para login ou dashboard conforme fluxo

#### `Home.tsx`
Tela inicial da aplicação ou painel inicial público/privado.

#### `Dashboard.tsx`
Principal painel do usuário.

- mostra acesso ao feed
- permite navegar para denunciar
- mostra ações importantes
- inclui acesso ao painel administrativo para admins
- responde ao menu mobile com hambúrguer

#### `Perfil.tsx`
Tela do perfil do usuário.

- exibe dados cadastrados
- atualiza nome, e-mail, foto e senha
- permite gestão do próprio perfil

#### `DenunciarPage.tsx`
Tela de registro de denúncia.

- formulário com categoria, cidade, estado, data e gravidade
- coleta coordenadas no mapa
- salva denúncia no sistema
- usa o estado local para persistência

#### `FeedNoticias.tsx`
Feed de notícias.

- lista notícias públicas
- permite curtir
- permite comentar
- admin pode criar nova notícia
- aceita imagem local selecionada do computador

#### `NoticiaPage.tsx`
Página de detalhe de uma notícia específica.

- mostra conteúdo completo
- comentários da notícia
- curtidas
- interações do usuário

#### `OngsPage.tsx`
Página que lista ONGs.

- mostra organizações, áreas de atuação e links
- é uma parte importante do ecossistema de mobilização ambiental

#### `AdminPanel.tsx`
Painel administrativo principal.

- lista usuários
- permite alterar status de contas
- possibilita bloquear por 30 ou 90 dias ou permanentemente
- permite buscar e filtrar usuários

#### `AdminDenunciasPage.tsx`
Painel administrativo de denúncias.

- lista todas as denúncias
- filtra por texto e status
- aceita, recusa, conclui ou coloca em andamento
- mostra histórico de mudanças

#### `AdminReportsPage.tsx`
Página de relatórios do administrador.

- mostra métricas gerais
- conta denúncias por status
- mostra quantidade de usuários ativos/inativos/bloqueados
- resume o estado geral do sistema

---

## 11) `Frontend/src/styles.css`

Arquivo de estilos globais.

### Função
- define estilos gerais da aplicação
- ajuda a padronizar layout, espaçamentos, botões, cards e páginas
- complementa os estilos do Material UI

Ele não substitui o MUI, mas ajuda a criar a base visual do projeto.

---

# Conclusão

O projeto está organizado em duas camadas bem separadas:

- Backend: regras, autenticação, banco, usuários, notícias e administração
- Frontend: interface, rotas, autenticação no cliente e páginas do app

Isso é uma estrutura saudável porque permite:

- manutenção mais fácil
- separação entre regras de negócio e interface
- crescimento do sistema sem misturar responsabilidades
- testes mais focados em cada parte

Se alguém quiser evoluir o projeto, o primeiro passo é entender esta divisão:

- o que fica em `Backend/app` é o núcleo da lógica do sistema
- o que fica em `Frontend/src` é a camada de experiência do usuário

A leitura correta desses arquivos é o mapa para entender a aplicação inteira.

---

Se quiser, posso também criar uma segunda versão desta documentação em formato mais visual, como:

- `MAPA_DAS_PASTAS.md`
- `ARQUITETURA_GERAL.md`
- `MANUAL_DO_DESENVOLVEDOR.md`
