# Frontend - Guardião Verde

Interface web do projeto, construída com React, TypeScript e Vite. A aplicação fornece o painel de usuários, fluxo de denúncias, feed de notícias, perfil, lista de ONGs e área administrativa.

## Stack

- React 19
- TypeScript
- Vite
- Material UI
- Axios
- React Router
- Leaflet

## Estrutura principal

```text
Frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── data/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tsconfig.app.json
├── tsconfig.node.json
└── README.md
```

## Requisitos

- Node.js 18+
- npm
- Backend rodando em `http://localhost:8000`

## Instalação

```powershell
cd Frontend
npm install
```

## Execução local

```powershell
npm run dev
```

Acesso:

- http://localhost:5173

## Build de produção

```powershell
npm run build
```

Visualização local da build:

```powershell
npm run preview
```

## API e autenticação

O cliente HTTP está em [Frontend/src/services/api.ts](Frontend/src/services/api.ts). Ele usa:

```ts
baseURL: 'http://localhost:8000'
```

O token JWT é salvo no `localStorage` e enviado automaticamente em requisições autenticadas.

## Funcionalidades principais

- Login e cadastro
- Dashboard do usuário
- Formulário de denúncia
- Feed e criação de notícias
- Perfil com atualização de dados e foto
- Painel administrativo
- Página de relatórios do administrador
- Lista de ONGs

## Observações

- O frontend depende do backend para autenticação, usuários, notícias e denúncias.
- Em alguns casos, a interface usa dados locais para simulação ou melhoria de UX, mas a integração principal é feita via API.
- Sempre valide o frontend com `npm run build` após alterações.

## Boas práticas

- Mantenha as rotas alinhadas com o arquivo [Frontend/src/routes/AppRoutes.tsx](Frontend/src/routes/AppRoutes.tsx).
- Ajuste os serviços em `src/services` quando houver mudança na API.
- Teste a aplicação com o backend ativo antes de concluir entregas.
