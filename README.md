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

| Variável                  | Para quê                                                                |
| ------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`            | Conexão da app com o Postgres (pooled).                                 |
| `DIRECT_URL`              | Conexão direta, usada pelo Prisma nas migrations (`prisma.config.ts`).  |
| `BETTER_AUTH_SECRET`      | Segredo do Better Auth (assina os cookies de sessão).                   |
| `BETTER_AUTH_URL`         | URL base do servidor de auth (ex.: `http://localhost:3000`).            |
| `NEXT_PUBLIC_APP_URL`     | URL pública da app, usada pelo client de auth.                          |
| `GOOGLE_BOOKS_API_KEY`    | Busca e página de livro, e o script `npm run books`.                    |
| `RESEND_API_KEY`          | Envio dos e-mails de verificação e de recuperação de senha.             |
| `RESEND_FROM_EMAIL`       | Remetente. Sem domínio verificado no Resend, só o dono da conta recebe. |
| `SKIP_EMAIL_VERIFICATION` | `true` pula a confirmação de e-mail no cadastro (útil em dev).          |

## Scripts

| Comando          | O que faz                                                                            |
| ---------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`    | Servidor de desenvolvimento.                                                         |
| `npm run build`  | Build de produção.                                                                   |
| `npm run lint`   | ESLint.                                                                              |
| `npm run format` | Prettier em todo o projeto (`format:check` só confere).                              |
| `npm run books`  | Regera `lib/data/books.json`, o catálogo da home. Ver [scripts/](scripts/README.md). |

## Banco

O schema fica em `prisma/schema.prisma` e as migrations em `prisma/migrations/`. Hoje o `.env` aponta para o Neon: aplicar migrations ali afeta dados reais.

## Rotas

- Públicas: `/`, `/auth`, `/book/[id]`, `/api/books`, `/api/books/search`, `/api/auth/*`.
- Logadas: o resto. O `proxy.ts` faz a checagem rápida pelo cookie e o layout `(secure)` valida a sessão no servidor.

O estado do projeto e o que falta estão em [ROADMAP.md](ROADMAP.md).
