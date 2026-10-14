# Trapiche — estado atual e o que falta

_Revisão de 13/10/2026, atualizada em 14/10/2026 (livro, listas e perfil). Base: leitura do código + testes no navegador (Chromium headless, dev server local) + `tsc`, `eslint`, `prettier` e `next build`._

## Como foi verificado

- `tsc --noEmit`: **ok**, sem erros.
- `prettier --check`: **ok**.
- `eslint`: **3 erros + 1 warning** depois das correções de bugs (ver "Qualidade de código").
- `next build`: **ok**.
- Navegador (14/10, com sua autorização, contra o Neon): cadastro real, todos os fluxos do livro (status, sessão, progresso, concluir, releitura, resenha, comentário, curtir, favoritar, listas), perfil (todas as abas, editar perfil, favoritos, nova entrada no diário, abandonar e voltar à pilha), página da lista (fixar, editar, compartilhada, convite com @ inexistente) e visitante deslogado.

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

### Livro (feito em 14/10/2026)

- `/book/[id]` (público) com o design completo ligado ao banco: status (Lendo, Quero ler, Lido, Abandonei, Relendo; clicar no status ativo tira da estante), curtir, favoritar (até 5), adicionar a listas (com criação de lista no próprio modal) e compartilhar (Web Share ou copia o link).
- "Sua leitura": progresso, página, início, previsão (pelo ritmo), sequência de dias, nª releitura, nota, últimas sessões. Botões "Registrar leitura de hoje", "Marcar como concluído" e "Editar progresso" abrem modais.
- Concluir abre o convite para a resenha. Resenha: nota de 1 a 5 + texto opcional, editar e apagar.
- Comunidade: nota média e distribuição do Trapiche (sem avaliações, cai para a nota do Google no topo), leitura média em dias, nº de listas públicas, resenhas em destaque (ordenadas por curtidas) com curtir e comentários, página `/book/[id]/resenhas` com todas (paginada).
- "Em N listas": suas listas e listas públicas da comunidade (com seguidores). "Quem leu esse, leu também": coocorrência entre leitores, completando com o Google (categoria e depois autor). "Mais de {autor}" com links. Ficha técnica só com os campos que existem.
- Livros ficam em cache na tabela `Book` (renovados a cada 7 dias).

### Listas (feito em 14/10/2026)

- `/lists/[id]`: pública, privada ou compartilhada. Dono edita, apaga e convida pessoas por @ (lista compartilhada). Membros adicionam e tiram livros, fixam a lista no perfil e podem sair. Visitantes seguem listas públicas.

### Perfil (feito em 14/10/2026)

- `/u/[handle]` é o perfil público. `/profile` redireciona para o seu. Abas por `?tab=`.
- Card com nome, @, cidade, "desde", bio, 6 números clicáveis, "Editar perfil" (nome, usuário, cidade, bio) e "Compartilhar".
- Início: 5 favoritos (com modal para reordenar e tirar), Lendo agora, atividade recente e histórico completo.
- **Estante** (aba nova, combinada com você): todos os livros por status. "Ver pilha →" leva para "Quero ler".
- Diário: estatísticas do ano (livros, páginas, horas, comparação com o ano anterior, média diária, sequência, recorde, dia mais cheio, mais rápido e mais lento), heatmap por ano, linha do tempo e "+ Nova entrada".
- Avaliações (com editar), Listas (filtros, fixadas, criar), Curtidas (por ano), Abandonos (motivo, onde parou, "Voltar à pilha") e Releituras.
- Visitantes não veem listas privadas nem os botões de edição.

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
- [x] `/book/[id]`: status, curtir, favoritos, lista e compartilhar salvam de verdade.
- [ ] Footer inteiro, Termos, Privacidade, Ajuda e redes sociais com `href="#"`.
- [ ] Home: links "ver todos" de Listas, Populares e Resenhas com `href="#"`. Resenhas usam lorem ipsum. Números do hero (14.8k leitores, 312k livros) são fictícios.
- [x] `/book` (sem id): a página mock foi removida; o design dela virou o `/book/[id]`.
- [x] `/profile`: tudo funcional.
- [x] Link do autor em `/book/[id]` leva para "Mais de {autor}". O breadcrumb "Livros" ficou como texto (não há página de catálogo ainda).

## O que falta construir (o produto em si)

Feito em 14/10/2026: schema do acervo (`Book`, `UserBook`, `Reading`, `ReadingSession`, `Review`, `ReviewLike`, `ReviewComment`, `List`, `ListMember`, `ListItem`, `ListFollow`, `Activity`; migration `20261013120000_reading_library` aplicada no Neon), livro, resenhas, listas e perfil.

1. **Home logada:** trocar o mock por "lendo agora", atividade recente e listas reais. Números do hero reais ou removidos.
2. **Busca completa:** página `/search?q=` com mais resultados (o header só mostra 8). Daria destino ao breadcrumb "Livros".
3. **Google OAuth** (botões já desenhados).
4. **Seção IA** (recomendação com 5 livros): definir o que é e implementar, ou tirar da home.
5. **Páginas institucionais:** Termos, Privacidade, Sobre (o cadastro pede aceite dos Termos, então eles precisam existir).
6. **Notificações** (o sino do header). Hoje não há nada para notificar; candidatos: comentário na sua resenha, convite para lista compartilhada, curtidas.

### Decidido com você nesta etapa

- Desenvolvimento e testes direto no Neon, com aprovação. O teste E2E criou e depois apagou o usuário `e2e-trapiche@example.com`; ficaram 3 livros no cache `Book`.
- Telas que não estavam no design foram criadas no mesmo visual: página da lista, página de resenhas, comentários e todos os modais.
- Ficha técnica mostra só o que o Google fornece. Saíram: peso, formato, título e idioma originais, tradutor, nº da edição e crédito da capa.
- Aba nova "Estante".

### Adicionado sem estar no design (para você validar)

- Chip **"Seguindo"** na aba Listas do seu perfil: sem ele, seguir uma lista não levava a lugar nenhum.
- Botão **"Sair da lista"** para quem colabora numa lista compartilhada.
- Clicar no status ativo do livro tira o livro da estante (com aviso).

### Ideias para discutir (não feitas)

- Editar e apagar entradas do diário (hoje só dá para criar; erros só se corrigem pelo "Editar progresso").
- Reordenar livros dentro de uma lista (hoje é por data de adição).
- Avatar com foto (hoje são as iniciais).

## Qualidade de código e infra

- [ ] Corrigir os 3 erros de `eslint` (`react-hooks/set-state-in-effect`) em `hero.tsx:70`, `poster.tsx:75` e `header-search.tsx:47`, e o `setSeed` sem uso em `hero.tsx:66`. Para o shuffle, sortear no servidor ou com `useState(() => ...)`. (O de `auth-content.tsx` saiu junto com o bug do `mode`.)
- [ ] Warning no console de `/auth`: `animation` misturado com `animationDelay` no pôster.
- [ ] Remover os comentários que fogem da regra (`// Logged-in user...` no proxy, `{/* Header */}`, `{/* Identity header */}`, docblocks em `catalog.ts`/`api/books`).
- [ ] Nenhum teste automatizado no repo. Os E2E desta etapa rodaram por scripts locais (Playwright); vale versionar os fluxos de livro, perfil e lista, de preferência contra um banco descartável.
- [ ] Google Books oscila (503 e respostas vazias). Há retentativa, mas "Quem leu também" e "Mais do autor" podem sumir quando a API falha. Categorias vêm em inglês ("Fiction / Classics").
- [ ] **Banco local para dev/testes:** hoje o `.env` aponta direto para o Neon, e o adapter `PrismaNeon` (WebSocket, trocado do HTTP para ter transações) só fala com Neon. Ter um Postgres local (docker) + adapter `pg` em dev permitiria testar auth e migrations sem tocar no banco real.
- [ ] Layout fixo em `min-w-360` (1440px): não há versão mobile.
- [x] Atualizar o README (setup, variáveis de ambiente, `npm run books`).
- [ ] Deploy: definir `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` de produção, `trustedOrigins` e o domínio do Resend (o cookie `__Secure-` no proxy já está resolvido).

## Sugestão para os próximos dias

1. Revisar no navegador as telas novas (livro, lista, perfil) e me dizer o que ajustar.
2. Remetente do e-mail (domínio no Resend), antes de chamar outras pessoas.
3. Home logada com dados reais.
4. Página de busca `/search`.
5. Termos e Privacidade (o cadastro já exige o aceite).
