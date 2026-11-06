import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

let directory,
  server,
  base,
  logs = '';
let admin, member, other, movie, genre;
const password = 'TestCinema123!';
const root = resolve(import.meta.dirname, '..');
async function request(path, method = 'GET', body, token) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
before(
  async () => {
    directory = await mkdtemp(join(tmpdir(), 'movie-api-test-'));
    await writeFile(join(directory, 'test.db'), '');
    const socket = createServer();
    socket.listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'file:' + join(directory, 'test.db'),
      JWT_SECRET: 'integration-test-secret',
      DEMO_PASSWORD: password,
      PORT: String(port),
      PROFILE_UPLOAD_DIR: join(directory, 'profiles'),
    };
    execFileSync(
      process.execPath,
      [
        join(root, 'node_modules/prisma/build/index.js'),
        'migrate',
        'deploy',
        '--config',
        'prisma7.config.ts',
      ],
      { cwd: root, env, stdio: 'pipe' },
    );
    execFileSync(process.execPath, ['dist/seed.js'], {
      cwd: root,
      env,
      stdio: 'pipe',
    });
    server = spawn(process.execPath, ['dist/main.js'], {
      cwd: root,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', (value) => {
      logs += value;
    });
    server.stderr.on('data', (value) => {
      logs += value;
    });
    base = 'http://127.0.0.1:' + port + '/api';
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(base)).ok) {
          ready = true;
          break;
        }
      } catch {}
      if (server.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, logs);
    admin = (
      await request('/auth/login', 'POST', {
        email: 'felipe.alves@example.com',
        password,
      })
    ).body;
    assert.ok(admin.accessToken);
  },
  { timeout: 30000 },
);
after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

const profilePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGN4Yiv0HwAFbwIzqvYdxgAAAABJRU5ErkJggg==',
  'base64',
);

test('edição do perfil salva imagens e descrição apenas da própria conta', async () => {
  // Esta conta é independente das usadas pelos demais fluxos.
  const account = (
    await request('/auth/login', 'POST', {
      email: 'elisa.rocha@example.com',
      password,
    })
  ).body;
  const initial = await request(
    '/users/me',
    'GET',
    undefined,
    account.accessToken,
  );
  const invalid = new FormData();
  invalid.set('displayName', 'Não deve salvar');
  invalid.set(
    'avatar',
    new Blob(['<svg>não é um PNG</svg>'], { type: 'image/png' }),
    'fake.png',
  );
  let response = await fetch(base + '/users/me', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + account.accessToken },
    body: invalid,
  });
  assert.equal(response.status, 400);
  assert.equal(
    (await request('/users/me', 'GET', undefined, account.accessToken)).body
      .displayName,
    initial.body.displayName,
  );
  assert.equal(
    (
      await request(
        '/users/me',
        'PATCH',
        { role: 'ADMIN' },
        account.accessToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/users/me',
        'PATCH',
        { userId: initial.body.id },
        account.accessToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/users/me',
        'PATCH',
        { bio: 'x'.repeat(501) },
        account.accessToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/users/me',
        'PATCH',
        { displayName: '  ' },
        account.accessToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request('/users/me', 'PATCH', { bio: 'sem token' })).status,
    401,
  );

  const data = new FormData();
  data.set('displayName', '  Perfil atualizado  ');
  data.set('bio', 'Cinema, memória e boas histórias.');
  data.set('avatar', new Blob([profilePng], { type: 'image/png' }), 'foto.png');
  data.set(
    'banner',
    new Blob([profilePng], { type: 'image/png' }),
    'banner.png',
  );
  response = await fetch(base + '/users/me', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + account.accessToken },
    body: data,
  });
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.equal(updated.displayName, 'Perfil atualizado');
  assert.match(updated.avatarUrl, /^\/api\/users\/images\/[a-f0-9-]+\.png$/);
  assert.notEqual(updated.avatarUrl, updated.bannerUrl);
  assert.equal(updated.passwordHash, undefined);
  const current = (
    await request('/users/me', 'GET', undefined, account.accessToken)
  ).body;
  assert.equal(current.bio, 'Cinema, memória e boas histórias.');
  assert.equal(current.bannerUrl, updated.bannerUrl);
  assert.equal(current.role, 'USER');
  const image = await fetch(new URL(updated.avatarUrl, base));
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.equal(image.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), profilePng);
  const publicProfile = (await request('/users/' + account.user.username)).body;
  assert.equal(publicProfile.avatarUrl, updated.avatarUrl);
  assert.equal(publicProfile.bannerUrl, updated.bannerUrl);
  assert.equal(publicProfile.email, undefined);
  await request(
    '/users/me',
    'PATCH',
    { bio: 'Somente texto' },
    account.accessToken,
  );
  assert.equal(
    (await request('/users/me', 'GET', undefined, account.accessToken)).body
      .avatarUrl,
    updated.avatarUrl,
  );

  const oversized = new FormData();
  oversized.set(
    'banner',
    new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }),
    'too-big.png',
  );
  response = await fetch(base + '/users/me', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + account.accessToken },
    body: oversized,
  });
  assert.equal(response.status, 413);
  const clear = new FormData();
  clear.set('removeAvatar', 'true');
  clear.set('removeBanner', 'true');
  clear.set('bio', '');
  response = await fetch(base + '/users/me', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + account.accessToken },
    body: clear,
  });
  assert.equal(response.status, 200);
  const cleared = (
    await request('/users/me', 'GET', undefined, account.accessToken)
  ).body;
  assert.equal(cleared.avatarUrl, null);
  assert.equal(cleared.bannerUrl, null);
  assert.equal(cleared.bio, '');
});

test('catálogo e dados do protótipo são públicos, sem dados privados', async () => {
  const highlights = await request('/movies/highlights');
  assert.equal(highlights.status, 200);
  assert.equal(highlights.body.movies.length, 6);
  assert.equal(highlights.body.recentReviews.length, 3);
  for (const review of highlights.body.recentReviews) {
    assert.equal(review.user.email, undefined);
    assert.equal(review.user.passwordHash, undefined);
    assert.ok(review.movie.id);
  }
  const result = await request('/movies?limit=12');
  assert.equal(result.status, 200);
  assert.equal(result.body.total, 12);
  assert.equal(result.body.data[0].title, 'Entre marés');
  assert.equal(result.body.data[0].averageRating, 4.5);
  assert.equal((await request('/genres')).body.length, 8);
  const detail = await request('/movies/demo-movie-0');
  assert.equal(detail.body.duration, 108);
  assert.equal(detail.body.genres.length, 2);
  assert.equal(detail.body.reviews.length, 2);
  assert.equal(detail.body.reviews[0].user.email, undefined);
  assert.equal((await request('/movies/filters')).body.years[0], 2025);
});
test('cadastro, validação de duplicidade, login e perfil privado', async () => {
  const input = {
    displayName: 'Pessoa de teste',
    email: 'member@example.com',
    password,
  };
  let result = await request('/auth/register', 'POST', input);
  assert.equal(result.status, 201);
  member = result.body;
  assert.equal(member.user.role, 'USER');
  assert.equal(member.user.passwordHash, undefined);
  assert.equal((await request('/auth/register', 'POST', input)).status, 409);
  assert.equal(
    (
      await request('/auth/register', 'POST', {
        ...input,
        email: 'attack@example.com',
        role: 'ADMIN',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request('/auth/login', 'POST', {
        email: input.email,
        password: 'Incorrect123!',
      })
    ).status,
    401,
  );
  const login = await request('/auth/login', 'POST', {
    email: input.email,
    password,
  });
  assert.ok(login.body.accessToken);
  const me = await request('/users/me', 'GET', undefined, member.accessToken);
  assert.equal(me.body.email, input.email);
  assert.equal(me.body._count.watched, 0);
  const profile = await request('/users/' + member.user.username);
  assert.equal(profile.body._count.watched, 0);
  assert.equal(profile.body.email, undefined);
  assert.equal(profile.body.passwordHash, undefined);
  other = (
    await request('/auth/register', 'POST', {
      username: 'other_member',
      email: 'other@example.com',
      password,
    })
  ).body;
});
test('a API bloqueia acesso administrativo sem permissão e tokens inválidos', async () => {
  assert.equal((await request('/admin/users')).status, 401);
  assert.equal(
    (await request('/admin/dashboard', 'GET', undefined, member.accessToken))
      .status,
    403,
  );
  assert.equal(
    (await request('/users/me', 'GET', undefined, 'invalid')).status,
    401,
  );
  assert.equal(
    (
      await request(
        '/movies',
        'POST',
        { title: 'Não permitido' },
        member.accessToken,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        '/genres',
        'POST',
        { name: 'Não permitido' },
        member.accessToken,
      )
    ).status,
    403,
  );
});
test('admin cadastra gênero e filme, valida campos e filtra catálogo', async () => {
  genre = (
    await request(
      '/genres',
      'POST',
      { name: 'Musical de teste' },
      admin.accessToken,
    )
  ).body;
  assert.ok(genre.id);
  assert.equal(
    (
      await request(
        '/genres',
        'POST',
        { name: 'Musical de teste' },
        admin.accessToken,
      )
    ).status,
    409,
  );
  assert.equal(
    (await request('/genres', 'POST', { name: '   ' }, admin.accessToken))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        '/movies',
        'POST',
        { title: 'Inválido', genreIds: ['missing'] },
        admin.accessToken,
      )
    ).status,
    400,
  );
  movie = (
    await request(
      '/movies',
      'POST',
      {
        title: 'Filme de teste',
        releaseYear: 2026,
        duration: 101,
        director: 'Diretora de teste',
        genreIds: [genre.id],
      },
      admin.accessToken,
    )
  ).body;
  assert.ok(movie.id);
  assert.equal(
    (
      await request(
        '/movies?q=Diretora%20de%20teste&year=2026&genre=' + genre.id,
      )
    ).body.total,
    1,
  );
  assert.equal((await request('/movies?year=1900')).body.total, 0);
  assert.equal((await request('/movies?page=-1&limit=1000')).body.limit, 50);
  assert.equal(
    (
      await request(
        '/genres/' + genre.id,
        'DELETE',
        undefined,
        admin.accessToken,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        '/movies/' + movie.id,
        'PATCH',
        { title: 'Título editado', genreIds: [genre.id] },
        admin.accessToken,
      )
    ).status,
    200,
  );
});
test('assistido é independente da avaliação e Watchlist não duplica', async () => {
  const token = member.accessToken;
  assert.equal(
    (await request('/movies/' + movie.id + '/watched', 'PUT', undefined, token))
      .status,
    200,
  );
  await request('/movies/' + movie.id + '/watched', 'PUT', undefined, token);
  let me = (await request('/users/me', 'GET', undefined, token)).body;
  assert.equal(me._count.watched, 1);
  assert.equal(me._count.reviews, 0);
  await request('/watchlist/' + movie.id, 'POST', undefined, token);
  await request('/watchlist/' + movie.id, 'POST', undefined, token);
  assert.equal(
    (await request('/watchlist', 'GET', undefined, token)).body.length,
    1,
  );
  const activity = (
    await request('/movies/' + movie.id + '/activity', 'GET', undefined, token)
  ).body;
  assert.equal(activity.watched, true);
  assert.equal(activity.inWatchlist, true);
  assert.equal(activity.review, null);
  await request('/watchlist/' + movie.id, 'DELETE', undefined, token);
  assert.equal(
    (await request('/watchlist', 'GET', undefined, token)).body.length,
    0,
  );
});
test('avaliações são únicas por autor, atualizam a média e marcam como assistido', async () => {
  const path = '/movies/' + movie.id + '/review';
  assert.equal(
    (await request(path, 'PUT', { rating: 0 }, member.accessToken)).status,
    400,
  );
  assert.equal(
    (
      await request(
        path,
        'PUT',
        { rating: 4, userId: other.user.id },
        member.accessToken,
      )
    ).status,
    400,
  );
  await request(
    path,
    'PUT',
    { rating: 4, comment: 'Primeira opinião' },
    member.accessToken,
  );
  await request(path, 'PUT', { rating: 2 }, other.accessToken);
  let detail = (await request('/movies/' + movie.id)).body;
  assert.equal(detail.averageRating, 3);
  assert.equal(detail.ratingCount, 2);
  await request(
    path,
    'PUT',
    { rating: 5, comment: 'Opinião editada' },
    member.accessToken,
  );
  detail = (await request('/movies/' + movie.id)).body;
  assert.equal(detail.averageRating, 3.5);
  assert.equal(detail.ratingCount, 2);
  assert.equal(
    (await request('/users/me', 'GET', undefined, other.accessToken)).body
      ._count.watched,
    1,
  );
  assert.equal(
    (await request('/users/me/watched', 'GET', undefined, member.accessToken))
      .body[0].movie.myRating,
    5,
  );
  const diary = (await request('/users/' + member.user.username + '/reviews'))
    .body;
  assert.equal(diary[0].comment, 'Opinião editada');
});
test('admin consulta e modera sem poder alterar a opinião do autor', async () => {
  const all = (
    await request('/admin/reviews', 'GET', undefined, admin.accessToken)
  ).body;
  const review = all.find(
    (r) => r.movieId === movie.id && r.userId === member.user.id,
  );
  assert.ok(review.id);
  const detail = await request(
    '/admin/reviews/' + review.id,
    'GET',
    undefined,
    admin.accessToken,
  );
  assert.equal(detail.body.user.email, 'member@example.com');
  assert.equal(
    (
      await request(
        '/admin/reviews/' + review.id,
        'PATCH',
        { rating: 1 },
        admin.accessToken,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        '/admin/reviews/' + review.id,
        'DELETE',
        undefined,
        member.accessToken,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        '/admin/reviews/' + review.id,
        'DELETE',
        undefined,
        admin.accessToken,
      )
    ).status,
    200,
  );
  assert.equal((await request('/movies/' + movie.id)).body.averageRating, 2);
  const me = (await request('/users/me', 'GET', undefined, member.accessToken))
    .body;
  assert.equal(me._count.reviews, 0);
  assert.equal(me._count.watched, 1);
});
test('admin edita contas sem expor senha, e a nova senha autentica', async () => {
  const list = (
    await request('/admin/users', 'GET', undefined, admin.accessToken)
  ).body;
  assert.ok(list.every((user) => user.passwordHash === undefined));
  const body = {
    displayName: 'Novo nome',
    email: member.user.email,
    role: 'USER',
    password: 'ChangedCinema123!',
  };
  assert.equal(
    (
      await request(
        '/admin/users/' + member.user.id,
        'PATCH',
        body,
        admin.accessToken,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request('/auth/login', 'POST', { email: body.email, password }))
      .status,
    401,
  );
  assert.equal(
    (
      await request('/auth/login', 'POST', {
        email: body.email,
        password: body.password,
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await request(
        '/admin/users/' + admin.user.id,
        'PATCH',
        { ...body, email: admin.user.email, role: 'USER' },
        admin.accessToken,
      )
    ).status,
    409,
  );
});
test('exclusão de filme limpa vínculos e o dashboard usa contagens reais', async () => {
  await request('/watchlist/' + movie.id, 'POST', undefined, other.accessToken);
  assert.equal(
    (
      await request(
        '/movies/' + movie.id,
        'DELETE',
        undefined,
        admin.accessToken,
      )
    ).status,
    200,
  );
  assert.equal((await request('/movies/' + movie.id)).status, 404);
  assert.equal(
    (await request('/watchlist', 'GET', undefined, other.accessToken)).body
      .length,
    0,
  );
  assert.equal(
    (
      await request(
        '/genres/' + genre.id,
        'DELETE',
        undefined,
        admin.accessToken,
      )
    ).status,
    200,
  );
  const data = (
    await request('/admin/dashboard', 'GET', undefined, admin.accessToken)
  ).body;
  assert.equal(data.movies, 12);
  assert.equal(data.genres, 8);
  assert.equal(data.users, 8);
  assert.equal(data.reviews, 8);
});
