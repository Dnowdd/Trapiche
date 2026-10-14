# scripts/

## `build-books.mjs` - catálogo mockado da home

Lê [`scripts/data/book-list.mjs`](data/book-list.mjs), busca cada livro na API do
Google Books e grava `lib/data/books.json`, que é o que `app/catalog.ts` e
`GET /api/books` servem para a home page.

```bash
npm run books                                   # incremental
node scripts/build-books.mjs --candidates="Vidas Secas - Graciliano Ramos"
node scripts/build-books.mjs --force            # refaz tudo do zero
node scripts/build-books.mjs --retry-missing    # tenta de novo o que faltou
node scripts/build-books.mjs --refetch-no-cover # rebusca os que ficaram sem capa
node scripts/build-books.mjs --only=clarice,rosa --force   # rebusca só esses
node scripts/build-books.mjs --limit=10         # teste rápido (teto de requisições)
node scripts/build-books.mjs --delay=2000       # ms entre requisições (padrão 1200)
```

> Os filtros (`--only`, `--limit`, `--refetch-no-cover`) escolhem **o que vai à
> rede**, não o que vai pro arquivo: a saída é sempre o catálogo inteiro (o que
> está em cache + o que acabou de ser buscado). Dá pra rebuscar um livro só sem
> perder os outros 259.

### As duas formas de listar um livro

```js
("_WD5EAAAQBAJ", // Vidas Secas - Graciliano Ramos
  "Dom Casmurro - Machado de Assis");
```

|             | id fixado                      | busca por título              |
| ----------- | ------------------------------ | ----------------------------- |
| requisições | 1                              | até 4                         |
| edição      | exatamente a que você escolheu | a que ganhar na pontuação     |
| quando usar | sempre que a capa importa      | pra incluir livro novo rápido |

A pontuação olha título, autor, idioma, capa e metadados - ela **não sabe qual
edição é a mais conhecida**. O Google devolve HQ, cordel, box, edição de luxo e
reimpressão de editora desconhecida no mesmo balaio, e várias trazem a _folha de
rosto_ no lugar da capa. Por isso o padrão da lista é id fixado.

O comentário depois do id não é decorativo: o script relê o arquivo como texto e
usa `// Título - Autor` como rótulo da entrada (é o que aparece no log, no
relatório e no campo `requested` do JSON).

### Trocando a edição de um livro

```bash
node scripts/build-books.mjs --candidates="Vidas Secas - Graciliano Ramos"
```

Imprime os candidatos já no formato da lista, com editora, ano, idioma, se tem
capa e o link da miniatura:

```
  "_WD5EAAAQBAJ", // Vidas secas: Edição Definitiva - Graciliano Ramos
      Todavia · 2024-04-08 · 223p · pt-BR · com capa · score 171
      https://books.google.com/books/content?id=_WD5EAAAQBAJ&...
```

Abra o link, veja se a capa presta, cole a linha por cima da antiga e rode
`npm run books` - ele busca só o que mudou.

### Como a busca por título funciona

1. Até 3 queries: `intitle:"T" inauthor:"A"` → `intitle:T inauthor:A` → `"T" "A"`.
   Para quando o melhor candidato passa de 95 pontos **e tem capa**.
2. Se o melhor achado não for em português, tenta mais uma com `langRestrict=pt`.
3. Título sem relação com o pedido é descartado na hora, mesmo com o autor certo -
   sem isso o Google devolve qualquer outro livro do mesmo autor.
4. Abaixo de 40 pontos, entra como **não encontrado**.
5. Duas entradas que caem no mesmo volume entram uma vez só.

### Cuidados com a API

- `sleep` de 1200 ms **entre todas** as requisições (inclusive as de retry).
- 429 / 403 / 5xx → backoff exponencial com jitter, até 5 tentativas.
- Cache em `scripts/data/.cache/google-volumes.json` (fora do git). Ele é indexado
  também por id do volume, então trocar uma entrada de título para id não custa
  requisição nova se aquele volume já tiver sido baixado.
- Precisa de `GOOGLE_BOOKS_API_KEY` no `.env` (o script lê o arquivo sozinho).

### Saídas

| arquivo                                   | o que é                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `lib/data/books.json`                     | o catálogo que a home consome (vai pro git)                                    |
| `scripts/data/build-report.json`          | não encontrados, ignorados, sem capa (já no formato de colar) e matches fracos |
| `scripts/data/.cache/google-volumes.json` | resposta crua do Google, para não refazer requisição                           |
