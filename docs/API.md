# Movie Rating API

API REST em NestJS com SQLite e Prisma. As rotas usam o prefixo `/api`.

## Executar localmente

1. Copie `.env.example` para `.env` e defina um `JWT_SECRET` longo e aleatório.
2. Instale dependências: `npm install`.
	Se o npm bloquear o script nativo do SQLite, execute `npm install-scripts approve better-sqlite3` e `npm rebuild better-sqlite3`.
3. Gere o Prisma Client e aplique a migração: `npm run db:generate` e `npm run db:migrate -- --name init`.
4. Inicie em desenvolvimento: `npm run start:dev`.

O servidor fica em `http://localhost:3000`; `GET /api` retorna o estado da API. Em produção, configure `JWT_SECRET` e `CORS_ORIGIN` explicitamente.

## Autenticação

`POST /api/auth/register` recebe `username`, `email` e `password` (mínimo de 8 caracteres). `POST /api/auth/login` recebe `email` e `password`. Ambos retornam `user` e `accessToken`. Envie o token nas rotas protegidas:

```http
Authorization: Bearer <accessToken>
```

## Rotas

| Método | Rota | Acesso | Uso |
| --- | --- | --- | --- |
| GET | `/api/movies?q=&page=1&limit=20` | Público | Buscar e paginar filmes |
| GET | `/api/movies/:id` | Público | Detalhes e avaliações do filme |
| POST | `/api/movies` | Token | Cadastrar filme (`title`, `releaseYear?`, `director?`, `synopsis?`, `posterUrl?`) |
| PUT | `/api/movies/:id/review` | Token | Criar/atualizar avaliação (`rating` de 1 a 5, `comment?`, `watchedAt?`) |
| DELETE | `/api/movies/:id/review` | Token | Remover sua avaliação |
| GET | `/api/users/:username` | Público | Perfil e contagens sociais |
| GET | `/api/users/:username/reviews` | Público | Diário de filmes avaliados |
| GET | `/api/users/:username/followers` | Público | Seguidores |
| GET | `/api/users/:username/following` | Público | Perfis seguidos |
| GET | `/api/users/me` | Token | Seu perfil |
| PATCH | `/api/users/me` | Token | Atualizar `displayName`, `bio` ou `avatarUrl` |
| POST | `/api/users/:username/follow` | Token | Seguir perfil |
| DELETE | `/api/users/:username/follow` | Token | Deixar de seguir perfil |
| GET | `/api/watchlist` | Token | Sua lista para assistir |
| POST | `/api/watchlist/:movieId` | Token | Adicionar filme à lista |
| DELETE | `/api/watchlist/:movieId` | Token | Remover filme da lista |

Há uma avaliação por usuário e filme; enviar `PUT` novamente substitui a anterior. O banco usa migrações Prisma e a API valida payloads, rejeitando campos desconhecidos.