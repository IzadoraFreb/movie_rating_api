import { expect, test } from '@playwright/test';

test('conferência visual das telas do protótipo em desktop', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  async function capture(route: string, heading: string, filename: string) {
    await page.goto(route);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Carregando…', { exact: true })).toHaveCount(0);
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
            icon: img.classList.contains('icon'),
            loaded: img.complete && img.naturalWidth > 0,
            width: rect.width,
            height: rect.height,
            nativeWidth: img.naturalWidth,
            nativeHeight: img.naturalHeight,
          };
        }),
      );
    for (const asset of assets) {
      expect(asset.loaded, asset.src || '').toBe(true);
      expect(asset.width, asset.src || '').toBeGreaterThan(0);
      expect(asset.height, asset.src || '').toBeGreaterThan(0);
      if (asset.icon) {
        expect(
          Math.abs(asset.width - asset.nativeWidth),
          asset.src || '',
        ).toBeLessThan(1);
        expect(
          Math.abs(asset.height - asset.nativeHeight),
          asset.src || '',
        ).toBeLessThan(1);
      }
      expect(
        Math.abs(
          asset.width / asset.height - asset.nativeWidth / asset.nativeHeight,
        ),
        asset.src || '',
      ).toBeLessThan(0.02);
    }
    await page.screenshot({
      path: info.outputPath(filename + '.png'),
      fullPage: true,
    });
  }
  async function authenticate(email: string) {
    const result = await page.request.post('/api/auth/login', {
      data: { email, password: 'Cinema123!' },
    });
    expect(result.ok()).toBe(true);
    const body = await result.json();
    await page.evaluate(
      (token) => localStorage.setItem('auth_token', token),
      body.accessToken,
    );
  }
  await capture('/', 'Todo filme merece uma boa conversa.', '00-inicio');
  await capture('/filmes', 'Encontre seu próximo filme', '01-catalogo');
  await capture('/filmes/demo-movie-0', 'Entre marés', '02-detalhes');
  await capture('/login', 'Bom ter você de volta', '03-login');
  await capture('/cadastro', 'Crie sua conta', '04-cadastro');
  await authenticate('ana.martins@example.com');
  await capture('/minha-area', 'Minha área', '05-area-pessoal');
  await capture(
    '/filmes/demo-movie-0/avaliar',
    'Editar minha avaliação',
    '06-editar-avaliacao',
  );
  await authenticate('felipe.alves@example.com');
  await capture('/admin', 'Visão geral', '07-dashboard');
  await capture('/admin/filmes', 'Filmes', '08-lista-filmes');
  await capture('/admin/generos', 'Gêneros', '09-lista-generos');
  await capture('/admin/usuarios', 'Usuários', '10-lista-usuarios');
  await capture('/admin/avaliacoes', 'Avaliações', '11-lista-avaliacoes');
  await capture('/admin/filmes/novo', 'Adicionar filme', '12-form-filme');
  await capture('/admin/generos/novo', 'Adicionar gênero', '13-form-genero');
  await capture(
    '/admin/usuarios/demo-user-0/editar',
    'Editar usuário',
    '14-form-usuario',
  );
  const reviews = await page.request.get('/api/admin/reviews', {
    headers: {
      Authorization:
        'Bearer ' +
        (await page.evaluate(() => localStorage.getItem('auth_token'))),
    },
  });
  const items = await reviews.json();
  await capture(
    '/admin/avaliacoes/' + items[0].id,
    'Visualizar avaliação',
    '15-moderacao',
  );
  expect(errors).toEqual([]);
});
