import { expect, test } from "@playwright/test";

test("unauthenticated visit to the admin buildings list redirects to login", async ({
  page,
}) => {
  await page.goto("/fr/admin/buildings");
  await expect(page).toHaveURL(/\/fr\/admin\/login/);
});

test("unauthenticated visit to a building edit page redirects to login", async ({
  page,
}) => {
  await page.goto("/fr/admin/buildings/nonexistent-id/edit");
  await expect(page).toHaveURL(/\/fr\/admin\/login/);
});

test("login page never reflects the raw ?error= query value, only the fixed message", async ({
  page,
}) => {
  const marker = "TOTALLY-UNIQUE-ERROR-MARKER-12345<script>window.__xss=1</script>";
  await page.goto(`/fr/admin/login?error=${encodeURIComponent(marker)}`);

  // The fixed, translated error message is shown...
  await expect(page.getByTestId("login-error")).toHaveText(
    "E-mail ou mot de passe invalide."
  );

  // ...and the raw query-string value is never rendered anywhere on the page.
  await expect(page.locator("body")).not.toContainText(marker);
  const html = await page.content();
  expect(html).not.toContain(marker);
});
