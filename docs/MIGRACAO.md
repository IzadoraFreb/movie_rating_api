# Atualizar instalações de versões anteriores

Estas orientações se aplicam a quem já possui um banco de uma versão anterior do projeto. Para uma instalação nova, siga o [README](../README.md): o catálogo começa vazio e pode ser preenchido pela importação do TMDB ou pelo cadastro manual.

## Atualizar o banco

Faça backup de `api/dev.db` (ou do banco configurado em `DATABASE_URL`), de `api/uploads/profiles` (ou da pasta configurada em `PROFILE_UPLOAD_DIR`) e dos cartazes locais em `api/public`.

Dentro de `api/`, execute:

```bash
npm run db:generate
npm run db:deploy
```

Esses comandos geram o cliente Prisma e aplicam as migrações pendentes, incluindo os campos de banner e de integração com o TMDB. Não é necessário repetir o seed.

O backend não sincroniza o catálogo com `api/public` ao iniciar. Os filmes existentes permanecem no banco; adicionar uma imagem nessa pasta e reiniciar a API não cadastra um filme automaticamente.

## Preservar filmes locais

Filmes sem vínculo com o TMDB usam as imagens de `api/public`. Mantenha esses arquivos. O cadastro e a edição manual de filmes locais exigem um título correspondente ao nome do cartaz, sem extensão e com underscores convertidos em espaços.

## Vincular filmes ao TMDB e resolver duplicatas

As operações de importação, associação e união exigem o JWT de login de um administrador, no cabeçalho `Authorization: Bearer SEU_TOKEN_DE_LOGIN`. Esse token é diferente do token do TMDB configurado no `.env`.

| Método e rota, com prefixo `/api` | Função |
| --- | --- |
| `GET /tmdb/search?q=Shrek&page=1` | Pesquisar títulos no TMDB |
| `GET /tmdb/movies/:tmdbId` | Consultar a ficha externa sem salvar |
| `POST /tmdb/movies/:tmdbId/import` | Importar ou devolver o filme existente |
| `PATCH /tmdb/local-movies/:movieId/link/:tmdbId` | Atualizar um filme antigo com os dados do TMDB, preservando seu ID |
| `PATCH /tmdb/local-movies/:movieId/merge/:tmdbId` | Unir uma duplicata importada ao filme antigo |

As duas consultas `GET` são públicas; a exigência de administrador se aplica à importação, associação e união. Há exemplos de requisições em [api/requests.http](../api/requests.http), executáveis com a extensão REST Client do VS Code.

Antes de associar ou unir registros, faça backup do banco e confira título e ano. A associação retorna `409 Conflict` se o identificador do TMDB já pertencer a outro registro ou se o filme antigo estiver vinculado a outro TMDB.

A união preserva o ID do filme antigo, transfere Watchlist e registros de assistido da duplicata e remove o registro importado em uma transação. Se o mesmo usuário já tiver uma dessas relações no antigo, a entrada antiga é mantida. A operação é bloqueada quando a duplicata importada possui avaliações; nesse caso, os dados precisam ser revisados antes de continuar. As avaliações do filme antigo são preservadas.

## Compatibilidade de rotas

A rota antiga `/admin/users` redireciona para `/admin/usuarios`.
