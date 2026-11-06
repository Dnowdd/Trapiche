# Trapiche

Diário de leituras: catalogue o que você lê, acompanhe o progresso, escreva resenhas e monte listas.

Next.js 16 (App Router), React 19, Tailwind v4, Better Auth, Prisma 7 + Postgres (Neon), Resend e Google Books.

## Rodando localmente

```bash
npm install
npm run dev
```

Antes, crie um `.env` na raiz com as variáveis abaixo.

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável                   | Para quê                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`             | Conexão da app com o Postgres (pooled).                                  |
| `DIRECT_URL`               | Conexão direta, usada pelo Prisma nas migrations (`prisma.config.ts`).   |
| `BETTER_AUTH_SECRET`       | Segredo do Better Auth (assina os cookies de sessão).                    |
| `BETTER_AUTH_URL`          | URL base do servidor de auth (ex.: `http://localhost:3000`).             |
| `NEXT_PUBLIC_APP_URL`      | URL pública da app, usada pelo client de auth.                           |
| `GOOGLE_BOOKS_API_KEY`     | Busca e página de livro, e o script `npm run books`.                     |
| `RESEND_API_KEY`           | Envio dos e-mails de verificação e de recuperação de senha.              |
| `RESEND_FROM_EMAIL`        | Remetente. Sem domínio verificado no Resend, só o dono da conta recebe.  |
| `SKIP_EMAIL_VERIFICATION`  | `true` pula a confirmação de e-mail no cadastro (útil em dev).           |
| `GOOGLE_CLIENT_ID`         | Login com Google. Sem as duas variáveis, o botão nem aparece.            |
| `GOOGLE_CLIENT_SECRET`     | Login com Google (OAuth client do Google Cloud).                         |
| `CRON_SECRET`              | Protege `/api/cron/daily` (cache, resumo do mês e lembretes).            |
| `UPSTASH_REDIS_REST_URL`   | Rate limit compartilhado. Sem ela, o limite fica em memória.             |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Upstash.                                                        |
| `NEXT_PUBLIC_SENTRY_DSN`   | Monitoramento de erros (opcional).                                       |
| `OPENAI_API_KEY`           | Liga o Prático, o assistente de leitura. Sem ela, ele não aparece.       |
| `OPENAI_MODEL`             | Modelo do assistente (padrão `gpt-6-luna`).                              |
| `OPENAI_REASONING_EFFORT`  | Esforço de raciocínio (padrão `low`; `off` para modelos sem raciocínio). |

## Scripts

| Comando                               | O que faz                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`                         | Servidor de desenvolvimento.                                                             |
| `npm run build`                       | Build de produção.                                                                       |
| `npm run lint`                        | ESLint.                                                                                  |
| `npm run format`                      | Prettier em todo o projeto (`format:check` só confere).                                  |
| `npm run books`                       | Regera `lib/data/books.json`, o catálogo da home. Ver [scripts/](scripts/README.md).     |
| `npm test`                            | Testes unitários.                                                                        |
| `npm run test:db`                     | Sobe o Postgres local de teste (Docker, porta 54329).                                    |
| `npm run test:integration`            | Testes de integração no banco local.                                                     |
| `npm run test:e2e`                    | Testes E2E com Playwright (sobe ou reaproveita o dev server na porta 3100, banco local). |
| `npm run admin:grant -- <email-ou-@>` | Promove uma conta a admin (`--revoke` remove). Usa `DIRECT_URL`/`DATABASE_URL`.          |

Os testes E2E sobem também um servidor falso da OpenAI (`tests/e2e/mock-openai.mjs`, porta 4010), então o assistente é testado sem chave nem custo. Para usar o assistente em dev sem chave real, rode o mesmo mock e aponte `OPENAI_BASE_URL=http://127.0.0.1:4010/v1` com qualquer `OPENAI_API_KEY`.

O CI (`.github/workflows/ci.yml`) roda typecheck, lint, Prettier e os testes unitários, de integração e E2E (incluindo acessibilidade com axe) a cada push na `main` e em pull requests.

## Login com Google

O botão “Entrar com Google” só aparece quando `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` existem.

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**. Antes, configure a [tela de consentimento OAuth](https://console.cloud.google.com/apis/credentials/consent) com nome, e-mail de suporte e os escopos `email`, `profile` e `openid`.
2. Em **Origens JavaScript autorizadas**, adicione `https://<seu-domínio>` (e `http://localhost:3000` para dev).
3. Em **URIs de redirecionamento autorizados**, adicione:
   - `https://<seu-domínio>/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (dev)
4. Copie o Client ID e o Client Secret para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` na Vercel e faça um novo deploy.

Contas novas ganham um @ automático (dá pra trocar no perfil). Se já existir uma conta com o mesmo e-mail, o Google é vinculado a ela.

## Banco

O schema fica em `prisma/schema.prisma` e as migrations em `prisma/migrations/`. Hoje o `.env` aponta para o Neon: aplicar migrations ali afeta dados reais.

## Rotas

- Públicas: `/`, `/auth`, `/book/[id]` (+ `/resenhas`, `/citacoes`), `/author/[nome]`, `/publisher/[nome]`, `/serie/[slug]`, `/citacao/[id]`, `/lists/[id]`, `/u/[handle]` (+ `/retrospectiva`), `/search`, as imagens OG de cada uma, `/api/books*`, `/api/auth/*`, `/api/v1/*` (chave de API) e `/api/email/unsubscribe`.
- Perfis respeitam a privacidade escolhida pela pessoa (`lib/privacy.ts`).
- Logadas: o resto. O `proxy.ts` faz a checagem rápida pelo cookie e o layout `(secure)` valida a sessão no servidor.

O estado do projeto e o que falta estão em [ROADMAP.md](ROADMAP.md).
