# Almoxarifado — versão Google Apps Script

Mesmo sistema de controle de almoxarifado (materiais, obras, entradas, saídas e aplicações
em campo), mas na versão **mais simples possível de colocar no ar**: tudo roda dentro do
próprio Google — sem Vercel, sem GitHub, sem Service Account, sem variáveis de ambiente em
outro serviço.

## Por que é mais simples que a versão Vercel

| | Versão Vercel | Versão Apps Script (esta) |
|---|---|---|
| Onde os dados ficam | Google Sheets | Google Sheets |
| Onde o código roda | Vercel (precisa de conta + GitHub) | Dentro da própria planilha |
| Acesso à planilha | Service Account (chave JSON) | Automático — o script já é "da casa" |
| Configuração | Várias variáveis de ambiente na Vercel | 2 campos nas Propriedades do Script |
| Link para compartilhar | `SEU-APP.vercel.app` | `script.google.com/macros/s/.../exec` |

A troca: a sessão de login expira em 6 horas (limite do Google), e a interface, embora
com a mesma identidade visual, é um pouco mais simples que a versão em React.

---

## Passo a passo (uns 5 minutos)

### 1. Crie a planilha e abra o editor de scripts

1. Crie uma planilha nova em branco no [Google Sheets](https://sheets.google.com).
2. No menu, vá em **Extensões → Apps Script**. Isso abre o editor com um projeto já
   vinculado à sua planilha (por isso não precisamos de nenhum ID ou chave de acesso).

### 2. Cole os arquivos deste projeto

No editor do Apps Script:

1. Apague o conteúdo padrão do arquivo `Código.gs`.
2. Para cada arquivo `.gs` deste pacote (`Code.gs`, `Db.gs`, `Auth.gs`, `Reports.gs`, `Api.gs`),
   crie um arquivo de script novo (ícone "+" → Script) com o mesmo nome e cole o conteúdo.
3. Para os arquivos `.html` (`Index.html`, `Styles.html`, `Script.html`), crie um arquivo
   HTML novo (ícone "+" → HTML) com o mesmo nome e cole o conteúdo.
4. Abra o arquivo de manifesto (ícone de engrenagem "Configurações do projeto" → marque
   "Mostrar arquivo de manifesto 'appsscript.json'" → o arquivo aparece na lista) e substitua
   o conteúdo pelo `appsscript.json` deste pacote.
5. Salve o projeto (ícone de disquete).

> **Dica:** se você tem o [clasp](https://github.com/google/clasp) instalado, é mais rápido
> rodar `clasp create --type sheets` na pasta deste projeto e depois `clasp push`.

### 3. Configure a conta administradora

1. No editor, vá em **Configurações do projeto** (ícone de engrenagem) → **Propriedades do script**.
2. Adicione duas propriedades:
   - `ADMIN_EMAIL` → o e-mail que você vai usar no primeiro acesso
   - `ADMIN_PASSWORD` → uma senha forte para o primeiro acesso

### 4. Publique como Web App

1. Clique em **Implantar → Nova implantação**.
2. Tipo: **App da Web**.
3. "Executar como": **Eu (seu e-mail)**.
4. "Quem pode acessar": **Qualquer pessoa** (o login do próprio sistema já controla o acesso;
   se preferir uma camada extra do Google, escolha "Qualquer pessoa com Conta Google").
5. Clique em **Implantar** e autorize as permissões solicitadas (é o próprio Google pedindo
   confirmação de que o script pode ler/escrever na planilha).
6. Copie a **URL do app da Web** gerada — é esse o link que você compartilha com a equipe.

### 5. Primeiro acesso

1. Abra a URL copiada e entre com o `ADMIN_EMAIL` / `ADMIN_PASSWORD` do passo 3.
2. Vá em **Usuários** e clique em **"Criar abas faltantes"** — o sistema cria sozinho, na
   planilha, todas as abas necessárias (`Materiais`, `Obras`, `Entradas`, `Saidas`,
   `Aplicacoes`, `Usuarios`) já com as colunas certas.
3. Cadastre as demais pessoas em **Usuários** e compartilhe o link com elas.
4. Cadastre materiais e obras, e comece a lançar entradas e saídas.

### Atualizando o sistema no futuro

Sempre que você colar código novo nos arquivos do projeto, é preciso gerar uma **nova
implantação** (Implantar → Gerenciar implantações → ícone de lápis → Nova versão) para que
as mudanças valham para quem já tem o link salvo.

---

## Limitações a ter em mente

- **Sessão de 6 horas.** É o teto do `CacheService` do Apps Script; passado esse tempo, a
  pessoa só precisa fazer login de novo.
- **Cotas do Google.** Contas gratuitas têm limite diário de execução de scripts (bem folgado
  para uso de uma equipe pequena/média, mas existe). Ver [quotas do Apps Script](https://developers.google.com/apps-script/guides/services/quotas).
- **Hash de senha mais simples.** Como o Apps Script não tem `bcrypt` nativo, as senhas são
  guardadas com SHA-256 salgado — seguro o bastante para uma ferramenta interna de equipe,
  mas não é o padrão de segurança de um produto voltado ao público em geral.
- **Sem domínio próprio "bonito"** por padrão — o link é o gerado pelo Google
  (`script.google.com/macros/s/.../exec`). Dá para mascarar com um redirecionamento de um
  domínio próprio, se precisar.

Se mais adiante você quiser um domínio customizado, mais performance ou uma interface em
React mais rica, a versão Vercel (no outro arquivo entregue) resolve isso — as duas usam a
mesma estrutura de dados na planilha e podem, inclusive, apontar para a mesma planilha.

## Estrutura do projeto

```
appsscript.json   → manifesto (permissões e tipo de implantação)
Code.gs           → ponto de entrada do Web App (doGet)
Db.gs             → leitura/escrita genérica na planilha
Auth.gs           → hash de senha e sessões (CacheService)
Reports.gs        → cálculo de estoque e estatísticas do dashboard
Api.gs            → todas as funções chamadas pelo frontend (google.script.run)
Index.html        → HTML raiz (carrega Tailwind, fontes, ícones e os módulos abaixo)
Styles.html       → identidade visual (tema industrial: grafite + âmbar)
Script.html       → toda a lógica do frontend (SPA em JavaScript puro, sem build)
```
