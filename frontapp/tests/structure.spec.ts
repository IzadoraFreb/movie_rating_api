import { expect, test } from "@playwright/test";

test("API e pôsteres locais funcionam após mover o backend", async ({
  request,
  page,
}) => {
  const catalog = await request.get("/api/movies?limit=50");
  expect(catalog.status()).toBe(200);
  expect((await catalog.json()).total).toBe(8);
  for (const path of ["/posters?title=Shrek", "/api/posters?title=Shrek"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/");
    expect((await response.body()).length).toBeGreaterThan(0);
  }
  await page.goto("/filmes");
  await expect(page.locator(".movie-card")).toHaveCount(8);
  await expect
    .poll(() =>
      page
        .locator(".movie-card img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
});

test("admin continua acessando a importação e os créditos", async ({
  request,
  page,
}) => {
  const response = await request.post("/api/auth/login", {
    data: { email: "felipe.alves@example.com", password: "Cinema123!" },
  });
  expect(response.status()).toBe(201);
  const session = await response.json();
  expect(session.user.role).toBe("ADMIN");
  await page.goto("/login");
  await page.evaluate(
    (token) => localStorage.setItem("auth_token", token),
    session.accessToken,
  );
  await page.goto("/admin/filmes");
  await page.getByRole("link", { name: "Importar do TMDB" }).click();
  await expect(
    page.getByRole("heading", { name: "Importar do TMDB" }),
  ).toBeVisible();
  await page.goto("/creditos");
  await expect(
    page.getByRole("heading", { name: "Créditos", exact: true }),
  ).toBeVisible();
});
