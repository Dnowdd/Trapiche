# Trapiche — estado atual e o que falta

_Revisão de 13/10/2026. Base: leitura do código + testes no navegador (Chromium headless, dev server local) + `tsc`, `eslint` e `prettier`._

## Como foi verificado

- `tsc --noEmit`: **ok**, sem erros.
- `prettier --check`: **ok**.
- `eslint`: **3 erros + 1 warning** depois das correções de bugs (ver "Qualidade de código").
- Navegador: home, header, busca, `/auth` (todos os modos), `/book/[id]`, `/book`, `/profile`, redirecionamentos do `proxy.ts`.
- **Login de ponta a ponta não foi testado**: ele lê e grava no banco Neon (remoto), e isso precisa da sua autorização. O fluxo foi revisado no código e a UI foi testada até o envio.

## O que está pronto

### Auth (Better Auth + Prisma + Neon)

- Cadastro com e-mail/senha + campo `handle` (único).
- Login, logout, "esqueci minha senha" e redefinição por token (`/auth?token=...`).
- Verificação de e-mail no cadastro (template `email_verification.html`) e e-mail de recuperação (`password_recovery.html`) via Resend.
- `SKIP_EMAIL_VERIFICATION=true` para pular a verificação em dev.
- UI de `/auth` completa: login, cadastro, esqueci, redefinir, card de "e-mail enviado", força da senha, pôster com capas.
- `proxy.ts` protege rotas: sem cookie → `/auth`; com cookie em `/auth` → `/`. **Testado e funcionando** para `/profile`, `/book`, `/book/[id]`.

### Header

- Logo, busca e área do usuário.
- Deslogado: "Entrar" e "Criar conta". Logado: avatar com iniciais, nome, `@handle`, menu com "Meu perfil" e "Sair".
- **Busca funciona quando logado** (testado): debounce de 600 ms, Google Books com título primeiro, navegação por ↑↓/Enter/Esc, clique abre `/book/[id]`.

### Home (pública)

- Hero, Como funciona, Listas, Seção IA, Populares, Resenhas, Citação, Footer.
- Catálogo vem de snapshot local (`lib/data/books.json`, 198 livros com capa), gerado por `npm run books`.
- `GET /api/books` (filtros `q`, `author`, `limit`, `withCover`).

### Livro

- `/book/[id]` com dados reais do Google Books: capa, título, autor, categorias, nota do Google, páginas, idioma, editora, ISBN, "Sobre o livro", ficha técnica. ID inválido → 404.

### Perfil

- `/profile` com layout completo e 7 abas (Início, Diário, Avaliações, Listas, Curtidas, Abandonos, Releituras). **100% mock** (Felipe Carvalho).

## Bugs encontrados (fazer primeiro)

_Corrigidos em 13/10/2026, exceto o do e-mail. Testados no navegador (Chromium headless) sem tocar no Neon: rotas sem cookie e com cookie falso, validações no cliente e respostas do Better Auth simuladas._

- [x] **Busca do header quebrava para quem não está logado.** Decisão: busca e livro são públicos. `/api/books/search` e `/book/[id]` liberados no `proxy.ts`, e `/book/[id]` foi movido para o grupo `(public)`. Deslogado, os botões de status, curtir e favoritar levam para `/auth`. A página do livro agora tem `<title>` próprio.
- [x] **"Criar conta" abria a tela de login.** O modo inicial vem da URL (`mode=register`, `token`). Isso também tirou o `useEffect` que dava erro de lint em `auth-content.tsx`.
- [x] **`proxy.ts` ia quebrar em produção (HTTPS).** Usa `getSessionCookie()` de `better-auth/cookies`, que aceita o prefixo `__Secure-`.
- [x] **O proxy só checava se o cookie existe.** O proxy continua sendo a checagem rápida, mas o layout `(secure)` valida a sessão no servidor com `requireSession()` (`lib/session.ts`) e o `/auth` só manda para `/` se a sessão for válida (antes, um cookie vencido prendia o usuário fora do login). **Atenção:** layout não roda de novo na navegação entre páginas do mesmo grupo. Quando houver dados reais, chamar `getSession()`/`requireSession()` em cada página, server action e API que lê ou grava dados do usuário.
- [x] **"Li e aceito os Termos" não era obrigatório.** O cadastro agora exige o aceite.
- [x] **Redefinir senha não conferia a confirmação.** Exige senhas iguais. Cadastro e redefinição exigem 8+ caracteres e pelo menos dois entre maiúscula/minúscula, número e símbolo. Campos vazios também são barrados antes de chamar a API.
- [x] **"Manter conectado neste dispositivo" não fazia nada.** Ligado a estado e enviado como `rememberMe` no `signIn.email`.
- [x] **Mensagens de erro do Better Auth chegavam em inglês.** Mapa `error.code` → pt-BR em `app/auth/_components/errors.ts` (inclui 429). `EMAIL_NOT_VERIFIED` mostra o botão "Reenviar e-mail de confirmação". O link de redefinição inválido (`/auth?error=INVALID_TOKEN`) também mostra aviso.
- [ ] **Remetente do e-mail é `onboarding@resend.dev`.** Esse remetente de teste do Resend só entrega para o dono da conta Resend, então outros usuários não recebem verificação nem recuperação. Verificar um domínio no Resend antes de abrir para outras pessoas. _(adiado)_
- [x] **Texto colado no dropdown da busca** ("8 RESULTADOS**PARA**"). Corrigido.
- [x] **Metadata padrão.** Título "Trapiche — seu diário de leituras", template `%s · Trapiche` e descrição em pt-BR. README reescrito (setup, variáveis de ambiente, scripts, rotas).

**Não testado de ponta a ponta:** cadastro, login, logout e redefinição reais, porque gravam no Neon. Para isso, preciso da sua autorização (ou de um banco local).

## UI morta (regra: nada de botão que não funciona)

- [ ] Botões "Continuar/Cadastrar com Google" ficam sempre desabilitados → configurar `socialProviders.google` ou remover.
- [ ] Sino de notificações no header sem ação.
- [ ] `/book/[id]`: Quero ler / Lendo / Lido / Relendo / Abandonei, Curtir, Favoritos, Adicionar à lista e Compartilhar só mudam estado local, sem salvar nada.
- [ ] Footer inteiro, Termos, Privacidade, Ajuda e redes sociais com `href="#"`.
- [ ] Home: links "ver todos" de Listas, Populares e Resenhas com `href="#"`. Resenhas usam lorem ipsum. Números do hero (14.8k leitores, 312k livros) são fictícios.
- [ ] `/book` (sem id): página mock inteira (Jorge Amado), com `href="index.html"` no breadcrumb. Remover ou redirecionar.
- [ ] `/profile`: tudo mock. Editar perfil, Compartilhar e os links "Editar →", "Ver pilha →" e "Histórico completo →" não fazem nada.
- [ ] Breadcrumb "Livros" e link do autor em `/book/[id]` não levam a lugar nenhum.

## O que falta construir (o produto em si)

Hoje o banco só tem as tabelas do Better Auth (`User`, `Session`, `Account`, `Verification`). Nenhuma ação do leitor é salva. Sugestão de ordem:

1. **Modelo de dados do acervo** (schema + migration, aplicar só com sua aprovação):
   - `Book`: cache local do volume do Google (googleId, título, autores, capa, páginas, ISBN), para não depender da API a cada página.
   - `Shelf`/`UserBook`: status por usuário (quero ler, lendo, lido, relendo, abandonei), datas de início e fim, curtido, favorito.
   - `ReadingSession`: diário (páginas, minutos, data), base para progresso, sequência e releituras.
   - `Review`: nota de 1 a 5 + texto.
   - `List` + `ListItem`: listas pública, privada e compartilhada.
2. **Ligar `/book/[id]` ao banco:** salvar status, curtida, favorito e progresso. Mostrar "Sua leitura" de verdade (os componentes de `book/_components` já existem, só que em cima de mock).
3. **Perfil real:** `/profile` com os dados do usuário logado e rota pública por handle (`/u/[handle]` ou `/@handle`). Editar perfil (nome, bio, avatar, cidade).
4. **Resenhas:** escrever, editar, listar no livro e no perfil.
5. **Listas:** criar, adicionar livro, ordenar, visibilidade.
6. **Home logada:** trocar o mock por "lendo agora", atividade recente e listas reais. Números do hero reais ou removidos.
7. **Busca completa:** página `/search?q=` com mais resultados (o header só mostra 8). Busca e livro já são públicos.
8. **Google OAuth** (botões já desenhados).
9. **Seção IA** (recomendação com 5 livros): definir o que é e implementar, ou tirar da home.
10. **Páginas institucionais:** Termos, Privacidade, Sobre (o cadastro pede aceite dos Termos, então eles precisam existir).

## Qualidade de código e infra

- [ ] Corrigir os 3 erros de `eslint` (`react-hooks/set-state-in-effect`) em `hero.tsx:70`, `poster.tsx:75` e `header-search.tsx:47`, e o `setSeed` sem uso em `hero.tsx:66`. Para o shuffle, sortear no servidor ou com `useState(() => ...)`. (O de `auth-content.tsx` saiu junto com o bug do `mode`.)
- [ ] Warning no console de `/auth`: `animation` misturado com `animationDelay` no pôster.
- [ ] Remover os comentários que fogem da regra (`// Logged-in user...` no proxy, `{/* Header */}`, `{/* Identity header */}`, docblocks em `catalog.ts`/`api/books`).
- [ ] Nenhum teste automatizado. Começar por um E2E do fluxo de auth (Playwright) contra um banco local/descartável.
- [ ] **Banco local para dev/testes:** hoje o `.env` aponta direto para o Neon, e `PrismaNeonHttp` só fala com Neon. Ter um Postgres local (docker) + adapter `pg` em dev permitiria testar auth e migrations sem tocar no banco real.
- [ ] Layout fixo em `min-w-360` (1440px): não há versão mobile.
- [x] Atualizar o README (setup, variáveis de ambiente, `npm run books`).
- [ ] Deploy: definir `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` de produção, `trustedOrigins` e o domínio do Resend (o cookie `__Secure-` no proxy já está resolvido).

## Sugestão para os próximos dias

1. ~~Corrigir os bugs da seção "Bugs encontrados"~~ feito, falta o remetente do e-mail.
2. ~~Decidir se livro e busca são públicos~~ decidido: são públicos.
3. Modelar o schema do acervo (`Book`, `UserBook`, `ReadingSession`, `Review`, `List`).
4. Ligar os botões de status do `/book/[id]` ao banco: é a primeira feature de verdade do produto.
5. Perfil real em cima desses dados.
