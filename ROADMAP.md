# Trapiche — estado atual e o que falta

_Atualizado em 6/11/2026._

## Pronto

### Conta e acesso

- Cadastro, login, verificação de e-mail, troca de e-mail e senha, redefinição de senha (Better Auth).
- Login com Google pronto no código. Fica escondido até `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` existirem. Contas novas ganham um @ automático; contas com o mesmo e-mail são vinculadas.
- Rate limit por rota (Upstash, com fallback em memória).
- Admin: `/admin`, `/admin/usuarios`, `/admin/denuncias`, `/admin/suporte`. O primeiro admin sai de `npm run admin:grant -- <email-ou-@>`.

### Livros e leitura

- Busca (Open Library primeiro, Google Books como fallback), página do livro agrupada por obra, edições, autor, editora.
- Estante com 5 status, sessões de leitura, progresso, releituras, abandonos, favoritos, curtidas, resenhas com nota e spoiler.
- **Citações:** guardar trechos com página e nota, públicos ou só para você. Aparecem no livro, na aba “Citações” do perfil, em `/book/[id]/citacoes` e numa página própria `/citacao/[id]`, feita para compartilhar. Podem ser denunciadas.
- **Tags:** prateleiras personalizadas com cor, públicas ou privadas. Marca na página do livro, filtra e gerencia na estante.
- **Séries:** obras ordenadas numa série, com “Livro 2 de 7”, progresso e próximo livro. Detectadas automaticamente pelo Open Library quando a edição informa; admins criam e editam na página do livro. Página `/serie/[slug]`.
- **Leitor de código de barras:** botão na busca abre a câmera e vai direto ao livro pelo ISBN. Usa o `BarcodeDetector` nativo quando existe e cai para o ZXing (carregado sob demanda) no iPhone e nos outros navegadores.
- **Importação:** `/importar` aceita export do Goodreads, planilha do Skoob ou qualquer CSV. Mostra prévia, processa em lotes com progresso ao vivo, traz status, datas, notas, resenhas e transforma prateleiras em tags. Lista o que não achou, com atalho para a busca.
- Diário, meta anual, retrospectiva anual e mensal, listas (públicas, privadas e compartilhadas), notificações, suporte com anexos, moderação.

### Privacidade e LGPD

- Perfil público, só para quem tem conta, ou só para você. Escolha por seção (estante, diário, atividade, meta, curtidas, cidade) e se aparece em buscadores. Botão “Ver como visitante”.
- Política de privacidade completa (base legal, fornecedores, transferência internacional, retenção, direitos).
- Export em JSON com tudo: estante, leituras, resenhas, citações, tags, importações, suporte com anexos, foto, sessões e métodos de login.
- Excluir conta apaga tudo em cascata.

### E-mails

- Template único. Opcionais (desligados por padrão): resumo do mês, nos 7 primeiros dias de cada mês, e lembrete após 10 dias sem registrar leitura (no máximo a cada 14 dias). Link de descadastro assinado e cabeçalho `List-Unsubscribe` de um clique.

### SEO

- Metadata completa por página (título, descrição, canonical, Open Graph, Twitter), `noindex` em páginas privadas, perfis fechados e buscas.
- JSON-LD: `WebSite` com busca, `Book` com nota agregada e resenhas, `BreadcrumbList`, `ProfilePage`, `ItemList`, `Person`, `BookSeries`, `Quotation`.
- Imagens OG geradas para home, livro, autor, série, lista, perfil, retrospectiva e citação, com fontes próprias (Fraunces, Inter, JetBrains Mono).
- Sitemap com livros, resenhas, autores, séries, listas, citações e só os perfis indexáveis. Robots, manifest e ícones.

### API v1 (chaves de desenvolvedor)

- Leitura: `/me`, `/shelf` (filtro `tag`), `/shelf/{bookId}`, `/readings`, `/lists`, `/lists/{id}`, `/lists/{id}/items`, `/tags`, `/quotes`, `/reviews/{bookId}`, `/goals/{year}`.
- Escrita, só com chaves criadas com “Permitir escrita”: perfil, privacidade e e-mails (`PATCH /me`), status, término, abandono, sessões, progresso, curtida, favorito e tags de cada livro, resenhas, citações, tags, listas e itens, meta anual. As rotas chamam as mesmas actions do site (mesmas regras e validações).

### Leitura e descoberta

- Formatos de leitura: físico (páginas), e-book (%) e audiolivro (tempo ouvido de um total), com conversão automática ao trocar de formato e sessões no formato certo.
- “Pra você ler depois” na home: leitores que leram o mesmo que você, autores que você lê e populares como reserva, sempre com o motivo.
- Busca e ordenação dentro da estante (título, autor, nota, data).
- Imagem da retrospectiva no formato de stories (1080×1920), com compartilhamento nativo no celular.
- Exportação da estante em CSV no formato do Goodreads.
- Modo escuro (sistema, claro ou escuro), sem piscar ao carregar, sem violações de acessibilidade.
- “Onde encontrar” no livro: Amazon (com tag de afiliado opcional), Estante Virtual e Google Play Livros.
- Desafios pessoais além da meta anual (por tag, autor, idioma, formato, livros longos ou curtos), com progresso automático, no painel e no perfil.
- “Não sei o que ler”: sorteio da pilha com filtros de tamanho, tag e autor, e botão para começar a ler.
- Empréstimos: com quem, desde quando, prazo, devolução; lembrete por notificação quando atrasa; selo na estante e card no painel.
- Retrospectiva com páginas por mês, distribuição e média das notas, idiomas, formatos e décadas de publicação.

### Qualidade de dados

- Admins corrigem título, autores, editora, ano, páginas, idioma, sinopse e capa de edições do Open Library. A edição corrigida para de sincronizar até alguém liberar.
- “Dados errados? Avise a gente” em cada livro abre um ticket de suporte já preenchido.
- Autores de mentira (“[author not identified]”, “unknown”) são filtrados na entrada e na leitura.

### Segurança e operação

- Limite por usuário para citações, comentários, resenhas, curtidas, listas, tags e denúncias (mensagem amigável quando passa).
- Vercel Web Analytics e Speed Insights (sem cookies). Sentry pronto, falta o DSN.
- Termos de uso atualizados: idade mínima, regras de conteúdo, citações e direito autoral (Lei 9.610, art. 46), importação, API e encerramento.
- Visitantes veem 404 em endereço inexistente; só as áreas privadas pedem login.

### Qualidade

- Testes unitários, de integração (Postgres local) e E2E com Playwright (cadastro, estante, tags, citações, séries, perfil privado, e-mails, chave de API, importação completa, scanner com câmera simulada, SEO e acessibilidade com axe), em desktop e mobile.
- Acessibilidade: zero violações WCAG 2.1 AA no axe nas telas principais; contraste dos tons de texto ajustado e foco visível pelo teclado.
- CI no GitHub Actions (`.github/workflows/ci.yml`): typecheck, lint, Prettier e testes unitários; integração e build com Postgres; E2E com Playwright.

## Antes de abrir para o público

- [ ] `RESEND_FROM_EMAIL` com domínio verificado no Resend (hoje só o dono da conta recebe e-mail).
- [ ] Vercel: `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` com o domínio final, `SKIP_EMAIL_VERIFICATION=false`, `CRON_SECRET`, `DIRECT_URL` sem `-pooler`, Upstash e Sentry.
- [ ] Google OAuth: criar o client no Google Cloud com o redirect `https://<domínio>/api/auth/callback/google` e setar as duas variáveis.
- [x] Aplicar a migration `20261106120000_privacy_quotes_tags_series_imports` no Neon.
- [x] Aplicar `20261107120000_api_key_write_scope` e `20261108120000_book_curation` no Neon.
- [x] Aplicar `20261109120000_reading_formats` e `20261110120000_challenges_loans` no Neon.
- [ ] Vercel: ativar Web Analytics e Speed Insights no painel do projeto.
- [ ] Logo, favicon definitivo e ícones (hoje há uma marca provisória “T” em `lib/og-mark.tsx` e `lib/og.tsx`).

## Próximos passos

- Biblioteca própria de livros (catálogo do Trapiche, cadastro de livros por usuários, capas próprias).
- Outros tipos de conteúdo (mangá, HQ, artigos).
