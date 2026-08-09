# Almoxarifado — Controle de Materiais

Sistema de controle de almoxarifado com **Google Sheets como banco de dados** e deploy em
**um clique na Vercel**, para você compartilhar o acesso com sua equipe pela internet.

Gerencia materiais, obras, entradas e saídas de estoque (Particular x Energisa) e aplicações
em campo, com estoque calculado automaticamente, dashboard com gráficos, alertas de estoque
baixo e controle de usuários com dois perfis (Administrador e Equipe).

## Por que Google Sheets?

Não existe nenhuma aba oculta de "banco de dados" para você configurar manualmente: o próprio
sistema cria as abas certas com um clique (veja o passo 4). Toda a planilha continua 100%
legível e editável por você a qualquer momento — é só uma planilha comum.

---

## Passo a passo para colocar no ar

### 1. Crie a planilha no Google Sheets

Crie uma planilha nova e em branco no [Google Sheets](https://sheets.google.com) e guarde o
**ID da planilha**, que fica na URL:

```
https://docs.google.com/spreadsheets/d/ESTE-TRECHO-AQUI-É-O-ID/edit
```

### 2. Crie uma Service Account no Google Cloud

O sistema acessa a planilha por meio de uma "conta de serviço" (sem precisar de login do Google
de cada pessoa):

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e crie um projeto (ou use um existente).
2. Ative a **Google Sheets API** (menu "APIs e serviços" → "Biblioteca").
3. Em "APIs e serviços" → "Credenciais" → "Criar credenciais" → **Conta de serviço**.
4. Depois de criada, abra a conta de serviço → aba "Chaves" → "Adicionar chave" → **JSON**. Um arquivo será baixado.
5. Abra esse arquivo JSON: você vai precisar dos campos `client_email` e `private_key`.

### 3. Compartilhe a planilha com a Service Account

Na planilha criada no passo 1, clique em **Compartilhar** e adicione o e-mail da Service
Account (o `client_email` do JSON) como **Editor**.

### 4. Faça o deploy na Vercel

1. Suba este projeto para um repositório no GitHub (ou GitLab/Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório. A Vercel detecta
   automaticamente que é um projeto Vite + funções serverless em `/api`.
3. Antes de finalizar, configure as **variáveis de ambiente** (Settings → Environment Variables):

   | Variável | Valor |
   |---|---|
   | `GOOGLE_SHEET_ID` | o ID copiado no passo 1 |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | o `client_email` do JSON |
   | `GOOGLE_PRIVATE_KEY` | o `private_key` do JSON (cole exatamente como veio, com as quebras de linha `\n`) |
   | `JWT_SECRET` | uma string aleatória e forte (ex.: gere uma em [1password.com/password-generator](https://1password.com/password-generator/)) |
   | `ADMIN_EMAIL` | o e-mail que você vai usar para o primeiro acesso |
   | `ADMIN_PASSWORD` | uma senha forte para o primeiro acesso |

4. Clique em **Deploy**. Em cerca de um minuto o site estará no ar em um endereço `.vercel.app`.

### 5. Primeiro acesso

1. Abra o site publicado e entre com o `ADMIN_EMAIL` / `ADMIN_PASSWORD` definidos acima —
   essa conta sempre funciona, mesmo com a planilha ainda vazia.
2. Vá em **Usuários** e clique em **"Criar abas faltantes"**. O sistema cria automaticamente,
   na sua planilha, todas as abas necessárias (`Materiais`, `Obras`, `Entradas`, `Saidas`,
   `Aplicacoes`, `Usuarios`) já com as colunas certas.
3. Cadastre as demais pessoas da equipe em **Usuários** (defina o perfil de cada uma:
   Administrador ou Equipe) e compartilhe o link do site com elas.
4. Cadastre os materiais e as obras, e comece a lançar entradas e saídas.

Pronto — o sistema está no ar e todo mundo com o link consegue acessar, com o controle de
acesso feito pelos perfis de usuário.

---

## Rodando localmente (opcional)

```bash
npm install
npm i -g vercel      # necessário para simular as funções serverless localmente
cp .env.example .env.local   # preencha com suas credenciais
vercel dev
```

O `vercel dev` sobe o frontend e as funções de `/api` juntos, em `http://localhost:3000`.

## Como o sistema funciona por dentro

- **Sem servidor fixo.** Cada rota de `/api` é uma função serverless independente (padrão da
  Vercel), o que significa custo zero em planos gratuitos para uso de equipes pequenas/médias.
- **Sem banco de dados redundante.** O estoque atual (Particular x Energisa, por material)
  é sempre **calculado a partir do histórico** de Entradas e Saídas — nunca fica "fora de
  sincronia" com os lançamentos, como aconteceria com uma aba de saldo mantida manualmente.
- **Login e senha reais.** Diferente de uma versão de demonstração, cada pessoa tem seu
  próprio e-mail e senha (com hash `bcrypt`, nunca texto puro), guardados na aba `Usuarios`.
  A conta `ADMIN_EMAIL`/`ADMIN_PASSWORD` é apenas uma chave-mestra de emergência para o
  primeiro acesso.
- **Histórico auditável.** Entradas, Saídas e Aplicações em Campo são somente de inclusão
  (não são editáveis nem podem ser apagadas pela interface) — o mesmo princípio de um livro
  de registro físico de almoxarifado.
- **Dois perfis de acesso:**
  - **Administrador** — cadastra materiais, obras e usuários; registra entradas; vê tudo.
  - **Equipe** — consulta materiais/obras/estoque, registra saídas e aplicações em campo.

## Estrutura do projeto

```
api/                    → funções serverless (Vercel)
  _lib/sheets.ts         → leitura/escrita genérica no Google Sheets
  _lib/auth.ts            → JWT + cookies httpOnly
  _lib/inventory.ts       → cálculo do estoque a partir de Entradas/Saídas
  auth/                   → login, logout, sessão atual
  materials/, works/      → CRUD de Materiais e Obras
  entries/, outputs/      → Entradas e Saídas de estoque
  field-applications/     → Aplicações em campo
  users/                  → gestão de usuários (admin)
  setup.ts                → cria as abas da planilha automaticamente
  stats.ts, inventory.ts  → dados agregados para o dashboard e o estoque

src/                    → frontend (React + Vite + Tailwind)
  pages/                  → uma página por módulo do sistema
  components/             → componentes de UI reutilizáveis
  lib/                    → cliente de API, autenticação, formatação, utilitários
```

## Licença

Uso livre para o seu negócio.
