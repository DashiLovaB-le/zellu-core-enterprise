import { expect, test } from "@playwright/test";

test("login carrega e não expõe o token no cliente", async ({ page }) => {
  const response = await page.goto("/login");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /Zēllu/i })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === "mmc-at" && !c.httpOnly)).toBe(false);
});

test("privacidade descreve o disclaimer clínico", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.locator("body")).toContainText(/não substitui/i);
});

test("respostas incluem headers de endurecimento", async ({ request }) => {
  const response = await request.get("/login");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["content-security-policy"]).toMatch(/default-src 'self'/);
});
