# Frontend do catálogo de filmes

Implementação do [protótipo no Figma](https://www.figma.com/design/Yc3G5sqB9UNGAKxabxWalZ/Prototipo-front-end) em Next.js, React e TypeScript, integrada à API NestJS da pasta raiz.

## Executar o projeto

Na raiz do repositório:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
npm run start:dev
```

O seed cria contas e gêneros de demonstração e sincroniza o catálogo com as imagens em `public`. O backend também sincroniza o catálogo ao iniciar: títulos vêm dos nomes dos arquivos, com underscores convertidos em espaços. Apenas filmes com cartaz local são mantidos; registros correspondentes preservam suas avaliações. Para incluir uma imagem nova, adicione-a a `public` em JPG, JPEG (incluindo `.jpe`), PNG ou WebP e reinicie o backend. Não execute o seed em produção.

Em outro terminal, dentro de `frontapp`:

```bash
npm install
npm run dev
```

Abra **http://localhost:3001**. A API usa a porta 3000. Se a API estiver em outro endereço, copie `.env.example` para `.env.local`, ajuste `API_URL` e reinicie o frontend. O navegador acessa `/api` no próprio frontend; o proxy encaminha as chamadas para o NestJS.

## Contas de demonstração

Após `npm run db:seed` na raiz:

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
| `/admin/generos` | Listagem, cadastro, edição e exclusão de gêneros |
| `/admin/usuarios` | Pesquisa, filtros e edição de contas |
| `/admin/avaliacoes` | Consulta e moderação de avaliações |

As rotas de formulário usam `/novo` e `/:id/editar`. O administrador visualiza uma avaliação em `/admin/avaliacoes/:id`. A rota antiga `/admin/users` redireciona para `/admin/usuarios`.

A interface usa CSS próprio com os tokens do protótipo, fonte Inter local e SVGs locais em `public/figma`. Não depende do Bootstrap, de CDNs de fontes ou de URLs temporárias do Figma. Pôsteres informados pelo usuário continuam dinâmicos, com arte de fallback se a imagem falhar.

Para personalizar a conta, clique no seu nome ou foto no cabeçalho e acesse **Editar perfil**. É possível trocar ou remover a foto e o banner, editar o nome de exibição e escrever uma descrição de até 500 caracteres. As imagens são selecionadas no computador ou celular e só são enviadas ao salvar. São aceitos PNG, JPG e WebP de até 5 MB cada. A prévia mostra o recorte circular da foto e o recorte horizontal do banner; cancelar descarta as alterações. A foto salva aparece no cabeçalho e nas avaliações, e o banner e a descrição aparecem na área pessoal.

Após atualizar um checkout existente, execute `npm run db:generate` e `npm run db:deploy` na raiz para adicionar o campo de banner. As imagens ficam no backend em `uploads/profiles` (configurável por `PROFILE_UPLOAD_DIR`), e essa pasta deve ser preservada junto com o banco.

O nome e a foto no cabeçalho abrem `/perfil/:username`, uma página com informações e avaliações publicadas. O botão **Minha área** abre o histórico e a Watchlist. **Editar perfil** aparece apenas na página do próprio perfil; visitantes não veem essa ação nem o e-mail da conta.

Os nomes e avatares nas avaliações de filmes, nas avaliações recentes do início e nas listagens administrativas também abrem o perfil público do usuário correspondente. A visualização não exige login.

## Verificações

```bash
# Na raiz: build e testes de integração da API
npm run build
npm run test:flows

# Em frontapp
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

`test:e2e` compila ambos os projetos e executa os fluxos no Chromium com um banco temporário, removido no fim. Use um Chromium instalado em `/usr/bin/chromium`, configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, ou execute `npx playwright install chromium`. Os testes usam as portas 4300 e 4301. Capturas de desktop/celular e traces de falhas ficam em `test-results/`.

## Referência visual

Foram obtidos contexto de implementação e render de 12 das 15 telas. O limite do plano Figma impediu a consulta final destas três:

- Gêneros — listagem: `5:20435`.
- Formulário de filme: `5:20935`.
- Editar avaliação pessoal: `5:21304`.

Essas três telas foram implementadas usando os componentes e estilos das telas acessíveis e a estrutura identificada no arquivo. A conferência visual exata delas depende de uma exportação ou de novo acesso ao Figma. Os layouts de celular foram adaptados a partir do protótipo desktop.

A API e as regras de acesso estão documentadas em [docs/API.md](../docs/API.md).
