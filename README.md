# movie_rating_api - Trabalho de Programação Web | UPF/2026

alunos: Henrique Tonello Zotti(210561), Marianne Fisch(209704), Izadora Freb da Silva(208958)

## Catálogo de filmes: API, web e mobile

Aplicação acadêmica com API NestJS, banco SQLite gerenciado pelo Prisma, frontend Next.js/React/TypeScript e aplicativo Flutter em `mobile`. A versão web implementa o [protótipo no Figma](https://www.figma.com/design/Yc3G5sqB9UNGAKxabxWalZ/Prototipo-front-end). Web e mobile usam a mesma API e compartilham filmes, avaliações, Watchlist e histórico. O TMDB fornece os dados e pôsteres dos filmes importados.

## Estrutura do repositório

```text
movie_rating_api/
├── api/          # Backend NestJS, Prisma, banco e arquivos locais
├── frontapp/     # Aplicação web Next.js
├── mobile/       # Aplicativo Flutter
├── docs/         # Documentação compartilhada
└── README.md
```

Cada aplicação tem suas próprias dependências e comandos. Execute os comandos npm do backend dentro de `api/`, os do site dentro de `frontapp/` e os do Flutter dentro de `mobile/`. Não há `package.json` na raiz.

O backend concentra `src/`, `prisma/`, `scripts/`, `test/`, `public/`, `uploads/`, `.env`, `.env.example`, `requests.http` e as configurações do NestJS, Prisma e TypeScript. O banco local padrão fica em `api/dev.db`; uploads ficam em `api/uploads/profiles`. `.env`, bancos, uploads e dependências permanecem fora do Git.

## Executar o projeto

Tenha Node.js e npm instalados. Para o aplicativo mobile, também é necessário Flutter com um dispositivo ou emulador configurado. A busca no TMDB e o carregamento dos pôsteres externos precisam de acesso à internet.

### Configurar o TMDB

1. Crie uma conta no [TMDB](https://www.themoviedb.org/) e solicite uma credencial na seção **API** das configurações da conta, informando o uso acadêmico e não comercial do projeto.
2. Copie o **API Read Access Token**, usado como Bearer pelo backend.
3. Na primeira configuração, copie `api/.env.example` para `api/.env`. Se o `.env` já existir, preserve suas configurações e acrescente ou preencha apenas a variável necessária.
4. No `api/.env`, configure:

```env
TMDB_READ_ACCESS_TOKEN=cole_seu_token_aqui
```

O `api/.env.example` mantém `TMDB_READ_ACCESS_TOKEN=` vazio, como modelo. O token real fica somente no `api/.env` do backend, que é ignorado pelo Git; não o coloque no frontend, no Flutter ou no repositório. Reinicie o backend após alterar a variável.

As outras variáveis do backend estão no modelo `api/.env.example`: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN` e `PROFILE_UPLOAD_DIR`. Configure um `JWT_SECRET` próprio. A configuração padrão do banco usa `api/dev.db`. Caminhos relativos no `.env` são resolvidos a partir de `api/` ao executar o backend nessa pasta; se usar caminhos absolutos personalizados, confira se continuam apontando para os arquivos corretos.

### Backend

A partir da raiz do repositório, para uma instalação nova:

```bash
cd api
npm install
cp .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
npm run start:dev
```

Antes de iniciar a API, preencha `api/.env` conforme a seção anterior. Não sobrescreva um `.env` existente ao repetir a instalação.

O seed cria contas e gêneros de demonstração. O catálogo começa vazio: entre com uma conta de administrador e siga a seção **Importar filmes do TMDB** para adicionar os primeiros títulos. Também é possível cadastrar filmes manualmente pelo painel web, usando cartazes locais. Não execute o seed em produção.

### Frontend web

Em outro terminal, a partir da raiz:

```bash
cd frontapp
npm install
npm run dev
```

Abra **http://localhost:3001**. A API usa a porta 3000. Se a API estiver em outro endereço, copie `frontapp/.env.example` para `frontapp/.env.local`, ajuste `API_URL` e reinicie o frontend. O navegador acessa `/api` no próprio frontend; o proxy encaminha as chamadas para o NestJS.

### Aplicativo mobile

Com o backend rodando, abra outro terminal na raiz e execute:

```bash
cd mobile
flutter pub get
flutter run
```

O host padrão é `10.0.2.2`, usado pelo emulador Android para acessar o computador. A API usa a porta 3000 e a origem web usa a porta 3001. Esses valores estão em `mobile/lib/core/config.dart` e podem ser alterados ao executar:

```bash
flutter run --dart-define=API_HOST=192.168.1.10 --dart-define=API_PORT=3000 --dart-define=WEB_PORT=3001
```

O IP acima é um exemplo: em um celular físico, substitua pelo IP local do computador que executa o backend. Celular e computador devem estar na mesma rede, e a porta da API deve estar acessível. `localhost` no celular aponta para o próprio celular. Para executar o app no próprio computador, use `--dart-define=API_HOST=127.0.0.1`.

Os parâmetros `--dart-define` são aplicados ao iniciar o app; reinicie a execução ao mudá-los. Para carregar alterações nos assets, execute `flutter pub get` e reinicie o aplicativo.

## Importar filmes do TMDB

A importação exige login com uma conta de administrador. A busca comum do catálogo, tanto no site quanto no mobile, consulta apenas os filmes já salvos no banco; ela não pesquisa todo o TMDB.

### Pelo site

1. Entre com a conta de administrador.
2. Acesse **Administrar → Filmes → Importar do TMDB**, ou `/admin/filmes/importar`.
3. Pesquise um título e confira o ano para distinguir filmes homônimos e remakes. A busca possui pôsteres e paginação.
4. Clique em **Adicionar ao catálogo**. O sistema salva a ficha e os gêneros e abre o filme usando seu ID interno.

### Pelo mobile

1. Entre com a conta de administrador e abra a aba **Filmes**.
2. Toque no **+** no topo para abrir **Importar do TMDB**.
3. Pesquise o título e toque no **+** ao lado do resultado escolhido.
4. O app volta ao catálogo e atualiza a lista. Use a busca para localizar o filme importado.

A tela mobile consulta somente a primeira página dos resultados. O botão de importação não aparece para usuários comuns, e a API também verifica a permissão de administrador.

### Dados e persistência

- `Movie.id` é o identificador interno usado nas avaliações, Watchlist e registros de assistido; `Movie.tmdbId` identifica o filme no TMDB.
- Reimportar o mesmo `tmdbId` devolve o registro existente, sem criar outra cópia nem atualizar automaticamente sua ficha.
- Filmes importados podem ser editados no painel web sem exigir cartaz local; o vínculo com o TMDB e o pôster são preservados.
- Para cadastrar um filme manualmente, coloque o cartaz em `api/public` e use no painel web um título correspondente ao nome do arquivo, sem extensão e com underscores convertidos em espaços. Apenas adicionar o cartaz não cadastra o filme.
- As avaliações da comunidade são independentes do TMDB e usam a escala de 1 a 5.
- Como web e mobile usam o mesmo backend, um filme importado em um fica disponível no outro ao atualizar o catálogo.

### Créditos

No site, os créditos ficam em `/creditos`, com acesso pelo rodapé. No mobile, ficam no ícone de informação da aba **Filmes**. Os logos usados estão em `frontapp/public/tmdb-logo.svg` e `mobile/assets/tmdb-logo.png`.

Os requisitos de atribuição e uso estão na [documentação oficial do TMDB](https://developer.themoviedb.org/docs/faq).

## Contas de demonstração

Após `npm run db:seed` dentro de `api/`:

| Perfil | E-mail | Senha de desenvolvimento |
| --- | --- | --- |
| Usuário | ana.martins@example.com | Cinema123! |
| Administrador | felipe.alves@example.com | Cinema123! |

É possível escolher outra senha definindo `DEMO_PASSWORD` antes da primeira execução do seed. Reexecutar o seed preserva as contas e suas senhas atuais.

## Telas e rotas

| Rota | Tela |
| --- | --- |
| `/` | Página inicial com apresentação, filmes em destaque e avaliações recentes da comunidade |
| `/filmes` | Catálogo completo, pesquisa por título/direção e filtros de gênero, ano e nota |
| `/generos` | Navegação por gênero |
| `/filmes/:id` | Ficha, média da comunidade, assistido, Watchlist e avaliações |
| `/login`, `/cadastro` | Acesso e criação de conta |
| `/minha-area` | Histórico, avaliações e Watchlist |
| `/perfil/:username` | Perfil com nome, foto, banner, descrição e avaliações publicadas |
| `/minha-area/editar` | Edição do nome, descrição, foto de perfil e banner, com prévia |
| `/filmes/:id/avaliar` | Criação e edição da própria avaliação |
| `/admin` | Dashboard com contagens e distribuição por gênero |
| `/admin/filmes` | Listagem, cadastro, edição e exclusão de filmes |
| `/admin/filmes/importar` | Pesquisa paginada no TMDB e importação de filmes |
| `/creditos` | Créditos do projeto e atribuição ao TMDB |
| `/admin/generos` | Listagem, cadastro, edição e exclusão de gêneros |
| `/admin/usuarios` | Pesquisa, filtros e edição de contas |
| `/admin/avaliacoes` | Consulta e moderação de avaliações |

As rotas de formulário usam `/novo` e `/:id/editar`. O administrador visualiza uma avaliação em `/admin/avaliacoes/:id`.

A interface usa CSS próprio com os tokens do protótipo, fonte Inter local e SVGs locais em `frontapp/public/figma`. Não depende do Bootstrap, de CDNs de fontes ou de URLs temporárias do Figma. Pôsteres locais e URLs de pôsteres do TMDB são exibidos com uma imagem alternativa se o carregamento falhar.

Para personalizar a conta, clique no seu nome ou foto no cabeçalho e acesse **Editar perfil**. É possível trocar ou remover a foto e o banner, editar o nome de exibição e escrever uma descrição de até 500 caracteres. As imagens são selecionadas no computador ou celular e só são enviadas ao salvar. São aceitos PNG, JPG e WebP de até 5 MB cada. A prévia mostra o recorte circular da foto e o recorte horizontal do banner; cancelar descarta as alterações. A foto salva aparece no cabeçalho e nas avaliações, e o banner e a descrição aparecem na área pessoal.

As imagens ficam no backend em `api/uploads/profiles` (configurável por `PROFILE_UPLOAD_DIR`), e essa pasta deve ser preservada junto com o banco.

O nome e a foto no cabeçalho abrem `/perfil/:username`, uma página com informações e avaliações publicadas. O botão **Minha área** abre o histórico e a Watchlist. **Editar perfil** aparece apenas na página do próprio perfil; visitantes não veem essa ação nem o e-mail da conta.

Os nomes e avatares nas avaliações de filmes, nas avaliações recentes do início e nas listagens administrativas também abrem o perfil público do usuário correspondente. A visualização não exige login.

## Verificações

```bash
# Em api: build e testes de integração da API
npm run build
npm run test:flows

# Em frontapp
npm run lint
npm run typecheck
npm run build
npm run test:e2e

# Em mobile
flutter pub get
flutter analyze
```

`test:e2e` compila ambos os projetos e executa os fluxos no Chromium com um banco temporário, removido no fim. Use um Chromium instalado em `/usr/bin/chromium`, configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, ou execute `npx playwright install chromium`. Os testes usam as portas 4300 e 4301. Capturas de desktop/celular e traces de falhas ficam em `test-results/`.

Os testes preparam seus filmes com `api/test/seed-catalog.mjs`, exclusivamente em ambiente de teste; o seed normal continua sem importar filmes. Para conferir especificamente a integração entre as pastas, execute `npm run test:e2e -- tests/structure.spec.ts` dentro de `frontapp/`.

### Conferência manual da integração

1. Importe um filme pelo site e confira sua ficha e pôster no mobile.
2. Importe outro filme pelo mobile e procure-o no catálogo web.
3. Reimporte o mesmo filme e confirme que seu ID interno não mudou.
4. Usando a mesma conta, publique uma avaliação, adicione à Watchlist e marque como assistido; confira os dados na outra plataforma após atualizar a tela.
5. Reinicie o backend e confira que filmes e atividades continuam salvos.
6. Confira que usuários comuns não têm acesso à importação e que os créditos aparecem nas duas versões.

A API e as regras de acesso estão documentadas em [docs/API.md](docs/API.md). Para atualizar uma instalação de uma versão anterior, consulte [docs/MIGRACAO.md](docs/MIGRACAO.md).
