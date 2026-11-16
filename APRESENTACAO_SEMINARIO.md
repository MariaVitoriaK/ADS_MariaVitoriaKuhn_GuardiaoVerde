# Guia da apresentação do projeto Guardião Verde

Este arquivo reúne o que você deve dizer e mostrar na apresentação, com foco no fluxo de denúncias, mas mantendo uma visão geral do sistema.

---

## 1. Objetivo da apresentação

A apresentação deve responder, de forma clara e objetiva:

- qual problema o projeto resolve;
- como a solução funciona;
- quais tecnologias foram usadas;
- quais funcionalidades principais existem;
- como o fluxo de denúncia funciona na prática.

O foco principal deve estar no fluxo de denúncia, porque ele é o coração do sistema e mostra a utilidade real do software.

---

## 2. Problema que o sistema resolve

Você pode começar dizendo algo assim:

> O Guardião Verde foi pensado para facilitar a denúncia e o monitoramento de problemas ambientais em comunidades. Muitas vezes, casos como descarte irregular, queimadas, poluição, destruição de áreas verdes ou outros impactos ambientais acabam não sendo reportados de forma organizada, rápida e acompanhável. Isso dificulta a resposta de autoridades, ONGs e comunidade local.

> Nosso sistema busca centralizar esse processo em uma plataforma web, permitindo que qualquer usuário registre uma denúncia, acompanhe seu status e contribua para a mobilização ambiental.

Pontos que podem ser mencionados:

- falta de canal simples para denúncia ambiental;
- pouca transparência no acompanhamento do caso;
- dificuldade de organização e gestão por parte de administradores;
- necessidade de um espaço para mobilização comunitária e apoio a causas ambientais.

---

## 3. Solução proposta

Diga de forma geral que o projeto é uma plataforma web com duas partes principais:

- Frontend: interface para usuário e administrador;
- Backend: API responsável por autenticação, regras de negócio e persistência dos dados.

A solução permite:

- cadastrar usuários;
- autenticar no sistema;
- criar denúncias com localização e detalhes;
- acompanhar o histórico de cada caso;
- visualizar e alterar o status da denúncia;
- administrar usuários e campanhas/ONGs;
- acompanhar notícias e interações comunitárias.

---

## 4. Diagrama de Casos de Uso (o que mostrar e explicar)

Se houver tempo, mostre um diagrama de casos de uso em slide ou em papel. O importante é deixar claro quem são os atores e o que cada um faz.

### Atores principais

- Usuário comum
- Administrador
- Sistema/Backend

### Casos de uso principais

#### Usuário comum
- realizar cadastro;
- fazer login;
- enviar denúncia;
- visualizar status da denúncia;
- acompanhar histórico;
- editar perfil;
- visualizar notícias;
- interagir com comentários/curtidas.

#### Administrador
- fazer login com permissão administrativa;
- visualizar todas as denúncias;
- filtrar denúncias por status;
- alterar status da denúncia;
- registrar observações;
- gerenciar usuários;
- acompanhar relatórios e métricas.

#### Sistema
- validar autenticação JWT;
- persistir dados no banco;
- registrar histórico de cada alteração;
- disparar e-mail de atualização para o usuário.

### Frase útil para apresentação

> O sistema foi pensado para conectar três papéis principais: o usuário que denuncia, o administrador que gerencia e o backend que valida, salva e acompanha o processo.

---

## 5. Tecnologias utilizadas

Você deve apresentar as tecnologias de forma breve, sem entrar em detalhes excessivos.

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL/SQLite compatível
- JWT para autenticação
- Alembic para migração do banco

### Frontend
- React
- TypeScript
- Vite
- Material UI
- Axios para comunicação com API

### Outros itens
- upload de arquivos/imagens;
- armazenamento local em frontend para UX local;
- uso de e-mail para comunicação de atualização do status.

### Frase de apresentação

> A aplicação foi construída com um backend em FastAPI e um frontend em React + TypeScript, criando uma solução moderna, organizada e fácil de evoluir.

---

## 6. Principais funcionalidades do sistema

A apresentação deve destacar as funcionalidades mais importantes, com foco em como elas ajudam o usuário final.

### Funcionalidades gerais
- cadastro e autenticação de usuários;
- bloqueio de contas e regras de segurança;
- gestão de perfil e fotos;
- feed de notícias;
- interação com conteúdo (curtidas e comentários);
- área administrativa para gestão do sistema.

### Funcionalidade central: fluxo de denúncia

Este é o ponto mais importante da apresentação.

#### Passo a passo do fluxo
1. O usuário acessa a página de denúncia;
2. preenche os dados da ocorrência;
3. informa categoria, localização, estado/cidade e descrição;
4. envia a denúncia;
5. o sistema cria o registro no backend;
6. a denúncia recebe status inicial `pendente`;
7. o administrador visualiza a denúncia;
8. ele analisa e altera o status;
9. o sistema registra o histórico da mudança;
10. o usuário recebe atualização sobre o andamento do caso.

### Status possíveis
- pendente
- aceita
- em_andamento
- resolvida
- recusada

### Frase-chave para falar

> O principal diferencial do sistema é que a denúncia não fica apenas registrada: ela passa a ter um histórico, um status e uma gestão real por parte da administração.

---

## 7. O que mostrar em funcionamento na apresentação

O ideal é mostrar a parte do software que mais chama atenção: o fluxo de denúncia completo.

### Sequência sugerida para a demonstração

#### 1. Mostrar a página inicial / login
- login do usuário
- cadastro de conta
- mostrar que há autenticação com token JWT

#### 2. Mostrar a página de denúncia
- formulário de denúncia
- campos principais
- seleção de categoria e localização
- descrição do problema
- envio da denúncia

#### 3. Mostrar o status inicial da denúncia
- falar que a denúncia foi registrada com status `pendente`
- mostrar o histórico inicial

#### 4. Mostrar o painel administrativo
- acesso do administrador
- lista de denúncias
- filtros por status
- detalhes da denúncia

#### 5. Alterar o status
- demonstrar que o administrador pode mudar o status da denúncia
- mostrar a atualização no histórico
- falar que o sistema cria um registro para cada mudança

#### 6. Mostrar a comunicação com o usuário
- dizer que o usuário pode receber atualização por e-mail ou visualizar o histórico
- explicar que o sistema mantém um rastreio completo do processo

### O que você deve enfatizar enquanto mostra o sistema

- a denúncia é o conteúdo central do produto;
- o fluxo é simples, mas segue uma lógica real de gestão;
- o administrador consegue controlar e acompanhar o processo;
- o usuário entende o andamento do caso;
- o sistema tem potencial de continuar evoluindo para casos reais de mobilização ambiental.

---

## 8. Roteiro de fala (15 minutos)

### 1 minuto: contextualização

> Boa tarde, meu nome é [seu nome]. Este projeto se chama Guardião Verde e foi desenvolvido para facilitar a denúncia e o acompanhamento de problemas ambientais na comunidade. O objetivo é dar uma forma simples e organizada para que pessoas possam registrar ocorrências e acompanhar a resposta do sistema.

> Muitas vezes, problemas ambientais são reportados de forma dispersa e sem controle. Nosso projeto centraliza esse processo em uma plataforma web, com autenticação, gestão de denúncias e acompanhamento de status.

### 1 minuto: arquitetura e tecnologias

> A aplicação é dividida em frontend e backend. O frontend é em React + TypeScript, enquanto o backend é em FastAPI com Python. O sistema usa autenticação JWT, banco relacional e regras de negócio para controlar quem pode criar, visualizar e alterar denúncias.

> Além disso, a arquitetura foi pensada para que cada ação do usuário e do administrador seja registrada e acompanhada, principalmente no fluxo de denúncia.

### 10 minutos: apresentação das funcionalidades e software funcionando

> Vamos mostrar agora o fluxo principal da aplicação: o envio de denúncia.

- mostrar a tela de login/cadastro;
- mostrar a criação da denúncia;
- explicar cada campo preenchido;
- mostrar que a denúncia foi registrada;
- mostrar status inicial `pendente`;
- mostrar o painel administrativo;
- mostrar a alteração do status;
- explicar o histórico registrado;
- comentar sobre a lógica de e-mail/atualização e o papel do administrador.

### 3 minutos: perguntas

> Concluindo, o projeto mostra uma solução prática para mobilização ambiental, com foco em organização, transparência e acompanhamento de denúncias. Muito obrigado.

---

## 9. Frases prontas para você usar

### Introdução
- “Nosso projeto tem como objetivo digitalizar e organizar o processo de denúncia ambiental.”
- “A ideia central é transformar uma ocorrência local em um caso gerenciável, rastreável e transparente.”

### Problema
- “Muitas denúncias ambientais não têm um canal organizado de acompanhamento.”
- “Sem um sistema estruturado, fica difícil acompanhar o que foi reportado e qual foi a resposta.”

### Solução
- “A plataforma permite que o usuário registre a ocorrência, enquanto o administrador acompanha e decide o próximo passo.”
- “O sistema torna o processo mais transparente e eficiente.”

### Fluxo de denúncia
- “A denúncia começa no formulário do usuário e termina com acompanhamento e atualização de status.”
- “O backend é responsável por validar, salvar e registrar o histórico da denúncia.”
- “O administrador é o responsável por avaliar e mudar o status da ocorrência.”

### Encerramento
- “O projeto mostra que é possível unir tecnologia, mobilização comunitária e gestão ambiental em uma solução simples e funcional.”

---

## 10. O que não esquecer

- explicar o problema em uma frase;
- falar da solução geral e do objetivo do projeto;
- mostrar o fluxo de denúncia de forma clara;
- mostrar o backend e frontend como partes do mesmo sistema;
- enfatizar que o sistema é funcional e que a denúncia tem status e histórico;
- mostrar a parte administrativa como diferencial do projeto;
- manter a apresentação em português, com linguagem simples e objetiva.

---

## 11. Resumo final em 3 linhas

> O Guardião Verde é uma plataforma para denúncia e acompanhamento de problemas ambientais.
> O fluxo central é: usuário registra a denúncia -> sistema salva e registra o caso -> administrador avalia e atualiza o status.
> A proposta é tornar a mobilização ambiental mais organizada, transparente e eficiente.
