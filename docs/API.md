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
| GET | `/api/movies/:id` | Público | Detalhes e avaliações do filme |
| POST | `/api/movies` | Admin | Cadastrar filme (`title`, `releaseYear?`, `duration?`, `director?`, `synopsis?`, `posterUrl?`, `genreIds?`) |
| PATCH | `/api/movies/:id` | Admin | Atualizar filme; título obrigatório; `genreIds: []` remove vínculos e `posterUrl: null` limpa o pôster |
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
| PATCH | `/api/users/me` | Token | Atualizar `displayName`, `bio` ou `avatarUrl` |
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

`npm run db:seed` adiciona os 12 filmes, 8 gêneros, 6 contas e 8 avaliações de demonstração, preservando registros existentes. Funciona somente fora de produção. Consulte [frontapp/README.md](../frontapp/README.md) para iniciar o frontend e usar as contas de demonstração.
