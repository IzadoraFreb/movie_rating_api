# Movie Rating API

API REST em NestJS com SQLite e Prisma. As rotas usam o prefixo `/api`.

## Executar localmente

1. Copie `.env.example` para `.env` e defina um `JWT_SECRET` longo e aleatório.
2. Instale dependências: `npm install`.
	Se o npm bloquear o script nativo do SQLite, execute `npm install-scripts approve better-sqlite3` e `npm rebuild better-sqlite3`.
3. Gere o Prisma Client e aplique as migrações existentes: `npm run db:generate` e `npm run db:deploy`. Para criar novas migrações, use `npm run db:migrate -- --name nome_da_alteracao`.
4. Inicie em desenvolvimento: `npm run start:dev`.

O servidor fica em `http://localhost:3000`; `GET /api` retorna o estado da API. Em produção, configure `JWT_SECRET` e `CORS_ORIGIN` explicitamente.

## Autenticação

`POST /api/auth/register` recebe `email`, `password` (mínimo de 8 caracteres), `displayName?` e `username?`. Quando omitido, o username é gerado. Contas novas sempre recebem o perfil `USER`; o cadastro rejeita o campo `role`. `POST /api/auth/login` recebe `email` e `password`. Ambos retornam `user` e `accessToken`. Envie o token nas rotas protegidas:

```http
Authorization: Bearer <accessToken>
```

## Rotas

| Método | Rota | Acesso | Uso |
| --- | --- | --- | --- |
| GET | `/api/movies?q=&genre=&year=&rating=&page=1&limit=20` | Público | Buscar por título/direção e filtrar catálogo; `rating=unrated` busca filmes sem nota; 1–5 filtram a faixa da média |
| GET | `/api/movies/filters` | Público | Anos disponíveis no catálogo |
| GET | `/api/movies/highlights` | Público | Seis filmes em destaque e três avaliações recentes para a página inicial, sem dados privados dos autores |
| GET | `/api/movies/:id` | Público | Detalhes e avaliações do filme |
| POST | `/api/movies` | Admin | Cadastrar filme cujo `title` corresponda a um arquivo de cartaz local em `public`; demais campos (`releaseYear?`, `duration?`, `director?`, `synopsis?`, `genreIds?`) são opcionais |
| PATCH | `/api/movies/:id` | Admin | Atualizar filme mantendo título correspondente a um cartaz em `public`; `genreIds: []` remove vínculos. O cartaz local não pode ser removido nem substituído por URL externa |
| DELETE | `/api/movies/:id` | Admin | Excluir filme e os registros associados |
| GET | `/api/movies/:id/activity` | Token | Estado de assistido, Watchlist e avaliação do usuário atual |
| PUT | `/api/movies/:id/watched` | Token | Registrar como assistido sem exigir nota |
| PUT | `/api/movies/:id/review` | Token | Criar/atualizar avaliação (`rating` de 1 a 5, `comment?`, `watchedAt?`) |
| DELETE | `/api/movies/:id/review` | Token | Remover sua avaliação |
| GET | `/api/users/:username` | Público | Perfil e contagens sociais |
| GET | `/api/users/:username/reviews` | Público | Diário de filmes avaliados |
| GET | `/api/users/:username/followers` | Público | Seguidores |
| GET | `/api/users/:username/following` | Público | Perfis seguidos |
| GET | `/api/users/me` | Token | Seu perfil, e-mail, role e contagens de assistidos/avaliações/Watchlist |
| GET | `/api/users/me/watched` | Token | Histórico de assistidos, com gênero e sua nota quando houver |
| PATCH | `/api/users/me` | Token | Atualizar `displayName`, `bio`, `avatarUrl?`, `bannerUrl?`; aceita JSON ou formulário multipart com os arquivos `avatar` e `banner` |
| GET | `/api/users/images/:filename` | Público | Carregar uma imagem de perfil enviada ao servidor |
| POST | `/api/users/:username/follow` | Token | Seguir perfil |
| DELETE | `/api/users/:username/follow` | Token | Deixar de seguir perfil |
| GET | `/api/watchlist` | Token | Sua lista para assistir |
| POST | `/api/watchlist/:movieId` | Token | Adicionar filme à lista |
| DELETE | `/api/watchlist/:movieId` | Token | Remover filme da lista |
| GET | `/api/genres` | Público | Gêneros e quantidade de filmes vinculados |
| POST | `/api/genres` | Admin | Criar gênero (`name`) |
| PATCH | `/api/genres/:id` | Admin | Atualizar nome |
| DELETE | `/api/genres/:id` | Admin | Excluir gênero sem filmes vinculados; retorna 409 se estiver em uso |
| GET | `/api/admin/dashboard` | Admin | Totais, avaliações recentes e distribuição por gênero |
| GET | `/api/admin/users` | Admin | Contas, e-mails e contagens, sem hashes de senha |
| GET | `/api/admin/users/:id` | Admin | Dados de uma conta |
| PATCH | `/api/admin/users/:id` | Admin | Atualizar `displayName`, `email`, `role` e `password?`; senha omitida é preservada |
| GET | `/api/admin/reviews` | Admin | Avaliações para moderação |
| GET | `/api/admin/reviews/:id` | Admin | Conteúdo completo, filme e autor |
| DELETE | `/api/admin/reviews/:id` | Admin | Excluir avaliação; não existe rota administrativa para alterar sua nota/comentário |

Há uma avaliação por usuário e filme; enviar `PUT` novamente substitui a anterior e registra o filme como assistido na mesma transação. Remover a avaliação preserva o histórico de assistidos. Médias são calculadas a partir das notas existentes. Administradores são verificados no banco a cada ação protegida e não podem remover o próprio acesso administrativo.

O banco usa migrações Prisma; a nova migração preserva os registros existentes e converte avaliações anteriores em histórico de assistidos. A API valida payloads, rejeitando campos desconhecidos. Os perfis públicos não expõem e-mail nem senha.

Na edição do próprio perfil, `displayName` aceita de 2 a 80 caracteres e `bio`, até 500. Foto e banner aceitam PNG, JPG ou WebP, com limite de 5 MB por arquivo. Use `removeAvatar=true` ou `removeBanner=true` para remover imagens; campos omitidos preservam o valor anterior. O usuário só altera a conta identificada pelo token. Campos administrativos, como `role` ou `userId`, são rejeitados nessa rota.

As imagens são salvas em `uploads/profiles`, fora do Git, ou no diretório definido em `PROFILE_UPLOAD_DIR`. Os nomes dos arquivos são gerados pelo servidor. A migração `20261105200000_profile_banner` adiciona o banner sem modificar os demais dados.

`npm run db:seed` cria 8 gêneros e 6 contas de demonstração e sincroniza os filmes com imagens JPG, JPEG (incluindo `.jpe`), PNG ou WebP em `public`. O título é o nome do arquivo sem extensão, com underscores substituídos por espaços. A API repete essa sincronização ao iniciar, preserva registros e avaliações de filmes que continuam tendo cartaz e remove filmes sem imagem correspondente. A sincronização não cria filmes sem cartaz e funciona somente fora de produção para o seed. Consulte [frontapp/README.md](../frontapp/README.md) para iniciar o frontend e usar as contas de demonstração.
