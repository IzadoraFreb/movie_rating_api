import { expect, test, type Page } from '@playwright/test';

const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGN4Yiv0HwAFbwIzqvYdxgAAAABJRU5ErkJggg==',
  'base64',
);
async function login(page: Page) {
  await page.goto('/login');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('elisa.rocha@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Cinema123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/minha-area');
}

async function openProfileEditor(page: Page) {
  await page
    .locator('.site-header')
    .getByRole('link', { name: 'Ver meu perfil', exact: true })
    .click();
  await page.getByRole('link', { name: 'Editar perfil', exact: true }).click();
}

test('nomes e fotos nas avaliações e no início abrem o perfil do autor', async ({
  page,
}) => {
  await login(page);
  await page.goto('/filmes/demo-movie-0');
  const author = page.getByRole('link', {
    name: 'Ver perfil de Bruno Costa',
    exact: true,
  });
  await expect(author).toHaveAttribute('href', '/perfil/bruno_costa');
  await author.locator('.profile-link-name').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await expect(
    page.getByRole('heading', { name: 'Bruno Costa', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Editar perfil', exact: true }),
  ).toHaveCount(0);
  await page.goto('/filmes/demo-movie-0');
  await author.locator('.avatar').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/filmes/demo-movie-0');
  await author.locator('.avatar').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await page.goto('/');
  const recentAuthor = page
    .locator('[aria-labelledby="recent-reviews-title"] .user-profile-link')
    .first();
  await expect(recentAuthor).toBeVisible();
  const href = await recentAuthor.getAttribute('href');
  const name = await recentAuthor.locator('.profile-link-name').textContent();
  await recentAuthor.locator('.profile-link-name').click();
  await expect(page).toHaveURL(href!);
  await expect(
    page.getByRole('heading', { name: name!, exact: true }),
  ).toBeVisible();
  await page
    .locator('.site-header')
    .getByRole('button', { name: 'Sair', exact: true })
    .click();
  await expect(page).toHaveURL('/');
  await page.goto('/filmes/demo-movie-0');
  await author.locator('.profile-link-name').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await expect(
    page.getByRole('link', { name: 'Editar perfil', exact: true }),
  ).toHaveCount(0);
});

test('nomes e fotos nas listagens administrativas abrem o perfil público', async ({
  page,
}) => {
  await page.goto('/login');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('felipe.alves@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Cinema123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/admin');
  const dashboardAuthor = page.locator('tbody .user-profile-link').first();
  await expect(dashboardAuthor).toBeVisible();
  const target = await dashboardAuthor.getAttribute('href');
  await dashboardAuthor.click();
  await expect(page).toHaveURL(target!);
  await page.goto('/admin/usuarios');
  await page.getByPlaceholder('Buscar por nome ou e-mail').fill('bruno.costa');
  const author = page.getByRole('link', {
    name: 'Ver perfil de Bruno Costa',
    exact: true,
  });
  await author.locator('.profile-link-name').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await expect(
    page.getByRole('heading', { name: 'Bruno Costa', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Editar perfil', exact: true }),
  ).toHaveCount(0);
  await page.goto('/admin/usuarios');
  await page.getByPlaceholder('Buscar por nome ou e-mail').fill('bruno.costa');
  await author.locator('.avatar').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await page.goto('/admin/avaliacoes');
  await page.getByPlaceholder('Buscar filme ou usuário').fill('Bruno');
  await author.first().click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await page.goto('/admin/avaliacoes');
  await page.getByPlaceholder('Buscar filme ou usuário').fill('Bruno');
  await page
    .getByRole('link', { name: 'Visualizar', exact: true })
    .first()
    .click();
  await author.locator('.avatar').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
});

test('nome e foto abrem o perfil e o botão Minha área mantém seu próprio destino', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/login');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('bruno.costa@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Cinema123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/minha-area');
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  const updated = await page.request.patch('/api/users/me', {
    headers: { Authorization: 'Bearer ' + token },
    multipart: {
      bio: 'Um bom filme merece uma boa conversa.',
      avatar: { name: 'foto.png', mimeType: 'image/png', buffer: pixel },
      banner: { name: 'banner.png', mimeType: 'image/png', buffer: pixel },
    },
  });
  expect(updated.ok()).toBe(true);
  await page.reload();
  const header = page.locator('.site-header');
  const profileLink = header.getByRole('link', {
    name: 'Ver meu perfil',
    exact: true,
  });
  await expect(profileLink).toHaveAttribute('href', '/perfil/bruno_costa');
  await profileLink.locator('span').last().click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await expect(
    page.getByRole('heading', { name: 'Bruno Costa', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Um bom filme merece uma boa conversa.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Avaliações publicadas', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Minha Watchlist', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('bruno.costa@example.com', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Editar perfil', exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images, (image) => image.decode().catch(() => {})),
    );
  });
  await page.screenshot({
    path: info.outputPath('perfil-desktop.png'),
    fullPage: true,
  });
  await header.getByRole('link', { name: 'Minha área', exact: true }).click();
  await expect(page).toHaveURL('/minha-area');
  await expect(
    page.getByRole('heading', { name: 'Minha área', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Editar perfil', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Minha Watchlist', exact: true }),
  ).toBeVisible();
  await profileLink.locator('img').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await page.getByRole('link', { name: 'Editar perfil', exact: true }).click();
  await expect(page).toHaveURL('/minha-area/editar');
  await expect(page.getByLabel('Descrição', { exact: true })).toHaveValue(
    'Um bom filme merece uma boa conversa.',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await profileLink.locator('img').click();
  await expect(page).toHaveURL('/perfil/bruno_costa');
  await expect(
    page.getByRole('heading', { name: 'Bruno Costa', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath('perfil-mobile.png'),
    fullPage: true,
  });
  await header.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/perfil/bruno_costa');
  await expect(
    page.getByRole('heading', { name: 'Bruno Costa', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Editar perfil', exact: true }),
  ).toHaveCount(0);
  await page.goto('/perfil/usuario_que_nao_existe');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Usuário não encontrado' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('usuário edita nome, descrição, foto e banner, com prévia e persistência', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  await openProfileEditor(page);
  await expect(page).toHaveURL('/minha-area/editar');
  await expect(page.getByLabel('Nome de exibição *')).toHaveValue(
    'Elisa Rocha',
  );
  const preview = page.getByRole('complementary', { name: 'Prévia do perfil' });
  await page.getByLabel('Nome de exibição *').fill('Elisa Cinéfila');
  await page
    .getByLabel('Descrição', { exact: true })
    .fill('Gosto de filmes que ficam na memória.');
  await expect(
    preview.getByRole('heading', { name: 'Elisa Cinéfila' }),
  ).toBeVisible();
  await page
    .getByLabel('Escolher foto', { exact: true })
    .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: pixel });
  await page.getByLabel('Escolher banner', { exact: true }).setInputFiles({
    name: 'banner.png',
    mimeType: 'image/png',
    buffer: pixel,
  });
  await expect(preview.locator('.avatar img')).toHaveAttribute('src', /^blob:/);
  await expect(
    preview.getByRole('img', { name: 'Banner do perfil' }),
  ).toHaveAttribute('src', /^blob:/);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: info.outputPath('editar-perfil-desktop.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Salvar alterações', exact: true })
    .click();
  await expect(page).toHaveURL('/minha-area');
  await expect(page.locator('.profile-summary')).toContainText(
    'Elisa Cinéfila',
  );
  await expect(page.locator('.profile-bio')).toHaveText(
    'Gosto de filmes que ficam na memória.',
  );
  const avatar = page.locator('.profile-summary .avatar img');
  await expect(avatar).toHaveAttribute('src', /^\/api\/users\/images\//);
  const avatarUrl = await avatar.getAttribute('src');
  await expect(
    page.getByRole('img', { name: 'Banner do perfil' }),
  ).toHaveAttribute('src', /^\/api\/users\/images\//);
  await page.reload();
  await expect(page.locator('.profile-summary .avatar img')).toHaveAttribute(
    'src',
    avatarUrl!,
  );
  await expect(page.locator('.profile-bio')).toHaveText(
    'Gosto de filmes que ficam na memória.',
  );
  expect(
    await page
      .locator('.profile-summary .avatar img')
      .evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await openProfileEditor(page);
  await page.getByLabel('Nome de exibição *').fill('Descartar este nome');
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('.profile-summary')).toContainText(
    'Elisa Cinéfila',
  );
  await openProfileEditor(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('heading', { name: 'Editar perfil', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('editar-perfil-mobile.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Remover foto', exact: true }).click();
  await page
    .getByRole('button', { name: 'Remover banner', exact: true })
    .click();
  await page.getByLabel('Descrição', { exact: true }).fill('');
  await page
    .getByRole('button', { name: 'Salvar alterações', exact: true })
    .click();
  await expect(page).toHaveURL('/minha-area');
  await expect(page.locator('.profile-summary .avatar img')).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Banner do perfil' })).toHaveCount(
    0,
  );
  await expect(page.locator('.profile-bio')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('editor exige sessão e mantém os dados quando o arquivo é inválido', async ({
  page,
}) => {
  await page.goto('/minha-area/editar');
  await expect(page).toHaveURL(/\/login\?next=/);
  await login(page);
  await page.goto('/minha-area/editar');
  const initialName = await page.getByLabel('Nome de exibição *').inputValue();
  await page.getByLabel('Escolher foto', { exact: true }).setInputFiles({
    name: 'texto.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('não é uma imagem'),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: 'Escolha uma imagem PNG' }),
  ).toBeVisible();
  await expect(page.getByLabel('Nome de exibição *')).toHaveValue(initialName);
  await page.getByLabel('Escolher banner', { exact: true }).setInputFiles({
    name: 'grande.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Cada imagem deve ter até 5 MB.' }),
  ).toBeVisible();
});
