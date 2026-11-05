import { expect, test, type Page } from '@playwright/test';

const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(failures.get(page)).toEqual([]);
});
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('Cinema123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
async function assetsLoaded(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images, (image) => image.decode().catch(() => {})),
    );
  });
  const assets = await page
    .locator('img[src^="/figma/"]')
    .evaluateAll((images) =>
      images.map((image) => {
        const img = image as HTMLImageElement;
        const rect = img.getBoundingClientRect();
        return {
          src: img.getAttribute('src'),
          loaded: img.complete && img.naturalWidth > 0,
          width: rect.width,
          height: rect.height,
          nativeWidth: img.naturalWidth,
          nativeHeight: img.naturalHeight,
        };
      }),
    );
  expect(assets.length).toBeGreaterThan(0);
  for (const asset of assets) {
    expect(asset.loaded, asset.src || '').toBe(true);
    expect(asset.width, asset.src || '').toBeGreaterThan(0);
    expect(asset.height, asset.src || '').toBeGreaterThan(0);
    expect(
      Math.abs(
        asset.width / asset.height - asset.nativeWidth / asset.nativeHeight,
      ),
      asset.src || '',
    ).toBeLessThan(0.02);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test('início e filmes têm conteúdo próprio e mantêm a aba correta ativa', async ({
  page,
}, info) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', {
    name: 'Navegação principal',
  });
  await expect(
    page.getByRole('heading', { name: 'Todo filme merece uma boa conversa.' }),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Início', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    navigation.getByRole('link', { name: 'Filmes', exact: true }),
  ).not.toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.movie-card')).toHaveCount(6);
  await expect(
    page.getByPlaceholder('Buscar por título ou direção'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'O que a comunidade está assistindo' }),
  ).toBeVisible();
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('inicio-desktop.png'),
    fullPage: true,
  });
  await page
    .getByRole('link', { name: 'Explorar filmes', exact: true })
    .click();
  await expect(page).toHaveURL('/filmes');
  await expect(page.locator('.movie-card')).toHaveCount(12);
  await expect(
    page.getByPlaceholder('Buscar por título ou direção'),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Filmes', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await navigation.getByRole('link', { name: 'Início', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: 'Todo filme merece uma boa conversa.' }),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder('Buscar por título ou direção'),
  ).toHaveCount(0);
});

test('catálogo, filtros, detalhes, assets e telas de acesso', async ({
  page,
}, info) => {
  await page.goto('/filmes');
  await expect(
    page.getByRole('heading', { name: 'Encontre seu próximo filme' }),
  ).toBeVisible();
  await expect(page.locator('.movie-card')).toHaveCount(12);
  await page.evaluate(() => document.fonts.ready);
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('catalogo-desktop.png'),
    fullPage: true,
  });
  await page.getByPlaceholder('Buscar por título ou direção').fill('Clara');
  await expect(page.locator('.movie-card')).toHaveCount(1);
  await page.getByPlaceholder('Buscar por título ou direção').fill('');
  await page.getByLabel('Filtrar por ano').selectOption('2025');
  await expect(page.locator('.movie-card')).toHaveCount(4);
  await page.getByLabel('Filtrar por ano').selectOption('');
  await page.getByLabel('Filtrar por nota').selectOption('unrated');
  await expect(page.locator('.movie-card')).toHaveCount(5);
  await page.getByLabel('Filtrar por nota').selectOption('');
  await page
    .getByPlaceholder('Buscar por título ou direção')
    .fill('filme inexistente');
  await expect(
    page.getByRole('heading', { name: 'Nenhum filme encontrado' }),
  ).toBeVisible();
  await page.getByPlaceholder('Buscar por título ou direção').fill('');
  await page.getByRole('heading', { name: 'Entre marés', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Entre marés', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Média da comunidade')).toBeVisible();
  await expect(page.locator('.review-card')).toHaveCount(2);
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('detalhes-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Avaliar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Bom ter você de volta' }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('login-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Cadastre-se' }).click();
  await expect(
    page.getByRole('heading', { name: 'Crie sua conta' }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('cadastro-desktop.png'),
    fullPage: true,
  });
});

test('cadastro, avaliação, assistido e Watchlist persistem após recarregar', async ({
  page,
}) => {
  await page.goto('/cadastro');
  await page.getByLabel('Nome', { exact: true }).fill('Pessoa do navegador');
  await page.getByLabel('E-mail', { exact: true }).fill('browser@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Cinema123!');
  await page.getByLabel('Confirmar senha').fill('Outra123!');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'As senhas não coincidem.' }),
  ).toHaveText('As senhas não coincidem.');
  await page.getByLabel('Confirmar senha').fill('Cinema123!');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/minha-area');
  await expect(page.getByRole('heading', { name: 'Minha área' })).toBeVisible();
  await page.goto('/filmes/demo-movie-0');
  await page.getByRole('button', { name: 'Adicionar à Watchlist' }).click();
  await expect(
    page.getByRole('button', { name: 'Na Watchlist', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como assistido' }).click();
  await expect(
    page.getByRole('button', { name: 'Assistido', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Avaliar', exact: true }).click();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByLabel('Comentário').fill('Uma descoberta especial.');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page).toHaveURL('/minha-area');
  await expect(page.getByText('Uma descoberta especial.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Uma descoberta especial.')).toBeVisible();
  await expect(page.locator('.history-row')).toHaveCount(1);
  await expect(page.locator('.watchlist-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remover filme' }).click();
  await expect(page.locator('.watchlist-row')).toHaveCount(0);
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito' }),
  ).toBeVisible();
  await page.goto('/minha-area');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.goto('/minha-area');
  await expect(page).toHaveURL(/\/login\?next=/);
});

test('área pessoal e edição de avaliação seguem os dados reais', async ({
  page,
}, info) => {
  await login(page, 'ana.martins@example.com');
  await expect(page).toHaveURL('/minha-area');
  await expect(page.locator('.history-row')).toHaveCount(3);
  await expect(page.locator('.watchlist-row')).toHaveCount(2);
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('minha-area-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Editar avaliação' }).first().click();
  await expect(page.getByLabel('Comentário')).toHaveValue(/Um filme delicado/);
  await expect(
    page.getByRole('radio', { name: '5', exact: true }),
  ).toBeChecked();
  await page.getByLabel('Comentário').fill('Revi e gostei ainda mais.');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Revi e gostei ainda mais.')).toBeVisible();
});

test('administra gêneros, filmes, contas e moderação', async ({
  page,
}, info) => {
  await login(page, 'felipe.alves@example.com');
  await expect(page).toHaveURL('/admin');
  await expect(
    page.getByRole('heading', { name: 'Visão geral' }),
  ).toBeVisible();
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('dashboard-desktop.png'),
    fullPage: true,
  });
  await page.goto('/admin/generos/novo');
  await page.getByLabel('Nome *', { exact: true }).fill('Musical de navegador');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page).toHaveURL('/admin/generos');
  await page
    .getByPlaceholder('Buscar por nome', { exact: true })
    .fill('Musical de navegador');
  await expect(
    page.getByText('Musical de navegador', { exact: true }),
  ).toBeVisible();
  await page.goto('/admin/filmes/novo');
  await page.getByLabel('Título *').fill('Um filme do navegador');
  await page.getByLabel('Ano de lançamento *').fill('2026');
  await page.getByLabel('Duração (minutos) *').fill('120');
  await page.getByLabel('Direção *').fill('Direção do teste');
  await page
    .getByLabel('Sinopse *')
    .fill('Uma história criada para validar o cadastro.');
  await page.getByRole('checkbox', { name: 'Musical de navegador' }).check();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page).toHaveURL('/admin/filmes');
  await page
    .getByPlaceholder('Buscar por título ou direção')
    .fill('Um filme do navegador');
  await expect(
    page.getByText('Um filme do navegador', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Título *')).toHaveValue(
    'Um filme do navegador',
  );
  await page.getByLabel('Título *').fill('Um filme editado');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page).toHaveURL('/admin/filmes');
  await page
    .getByPlaceholder('Buscar por título ou direção')
    .fill('Um filme editado');
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(
    page.getByText('Um filme editado', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Um filme editado', { exact: true })).toHaveCount(
    0,
  );
  await page.goto('/admin/usuarios');
  await page.getByPlaceholder('Buscar por nome ou e-mail').fill('ana.martins');
  await page.getByRole('link', { name: 'Visualizar perfil' }).click();
  await page
    .getByLabel('Nome *', { exact: true })
    .fill('Ana Martins Atualizada');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page).toHaveURL('/admin/usuarios');
  await page.screenshot({
    path: info.outputPath('usuarios-desktop.png'),
    fullPage: true,
  });
  await page
    .getByPlaceholder('Buscar por nome ou e-mail')
    .fill('Ana Martins Atualizada');
  await expect(
    page.getByText('Ana Martins Atualizada', { exact: true }),
  ).toBeVisible();
  await page.goto('/admin/avaliacoes');
  await page
    .getByRole('link', { name: 'Visualizar', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Visualizar avaliação' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Excluir avaliação', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click();
  await expect(page).toHaveURL('/admin/avaliacoes');
});

test('layout de celular mantém navegação, formulários e catálogo acessíveis', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.movie-card')).toHaveCount(6);
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('inicio-mobile.png'),
    fullPage: true,
  });
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Filmes', exact: true })
    .click();
  await expect(page.locator('.movie-card')).toHaveCount(12);
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('catalogo-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('heading', { name: 'Entre marés', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Avaliar', exact: true }),
  ).toBeVisible();
  await assetsLoaded(page);
  await page.goto('/login');
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
  await assetsLoaded(page);
  await login(page, 'felipe.alves@example.com');
  await expect(page).toHaveURL('/admin');
  await page.getByRole('heading', { name: 'Visão geral' }).waitFor();
  await assetsLoaded(page);
  await page.screenshot({
    path: info.outputPath('dashboard-mobile.png'),
    fullPage: true,
  });
  await page.goto('/admin/filmes');
  await expect(page.locator('tbody tr')).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: 'Adicionar filme' }).click();
  await expect(page.getByLabel('Título *')).toBeVisible();
});
