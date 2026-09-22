import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./fixtures/login";
import { NO_MATCH_ADDRESS_MARKER } from "./fixtures/nominatim-stub";

// Server Actions respond to the form's own POST in a single roundtrip
// (mutation + re-render), but when that roundtrip lands on the *same* URL
// (e.g. re-saving an edit form) there's no URL change for Playwright's
// waitForURL to key off — so wait for the POST response itself instead.
async function submitAndWait(page: Page): Promise<void> {
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST"),
    page.locator("main button[type=submit]").click(),
  ]);
}

test.describe("admin building management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("create, edit, and delete a building through the confirmation step", async ({
    page,
  }) => {
    const uniqueSuffix = `${Date.now()}-${test.info().workerIndex}`;
    const name = `E2E Test Building ${uniqueSuffix}`;
    const renamedName = `E2E Test Building ${uniqueSuffix} (renamed)`;

    // Create.
    await page.goto("/fr/admin/buildings/new");
    await page.locator("#name").fill(name);
    await page.locator("#address").fill("59 rue Vercingétorix");
    await page.locator("#historyFr").fill("Histoire de test.");
    await page.locator("#historyEn").fill("Test history.");
    await page.locator("#styleTags").fill("Modernist, Concrete");
    await submitAndWait(page);

    // After create, redirected to the edit page with geocoded coordinates
    // shown back in the editable fields.
    await page.waitForURL(/\/fr\/admin\/buildings\/[^/]+\/edit$/);
    await expect(page.locator("#lat")).toHaveValue("48.8271");
    await expect(page.locator("#lng")).toHaveValue("2.3372");

    // Appears in the list.
    await page.goto("/fr/admin/buildings");
    const row = page.locator("tr", { hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByText("Oui")).toBeVisible(); // geocoded: yes

    // Edit.
    await row.locator('a[href*="/edit"]').click();
    await page.waitForURL(/\/edit$/);
    await page.locator("#name").fill(renamedName);
    await submitAndWait(page);
    await expect(page.locator("#name")).toHaveValue(renamedName);

    await page.goto("/fr/admin/buildings");
    await expect(page.locator("tr", { hasText: renamedName })).toBeVisible();
    await expect(page.locator("tr", { hasText: name, hasNotText: "renamed" })).toHaveCount(0);

    // Delete, via the confirmation step.
    const renamedRow = page.locator("tr", { hasText: renamedName });
    await renamedRow.locator('a[href*="/delete"]').click();
    await page.waitForURL(/\/delete$/);
    await expect(page.getByTestId("cascade-warning")).toBeVisible();

    await page.locator("#confirmName").fill("wrong name");
    await submitAndWait(page);
    await expect(page.getByTestId("confirm-mismatch")).toBeVisible();

    await page.locator("#confirmName").fill(renamedName);
    await submitAndWait(page);

    await page.waitForURL(/\/fr\/admin\/buildings$/);
    await expect(page.locator("tr", { hasText: renamedName })).toHaveCount(0);
  });

  test("shows a notice and saves with null coordinates when geocoding finds no match", async ({
    page,
  }) => {
    const uniqueSuffix = `${Date.now()}-${test.info().workerIndex}`;
    const name = `E2E Unmapped Building ${uniqueSuffix}`;

    await page.goto("/fr/admin/buildings/new");
    await page.locator("#name").fill(name);
    await page.locator("#address").fill(`Address with ${NO_MATCH_ADDRESS_MARKER}`);
    await page.locator("#historyFr").fill("Histoire de test.");
    await page.locator("#historyEn").fill("Test history.");
    await submitAndWait(page);

    await page.waitForURL(/\/fr\/admin\/buildings\/[^/]+\/edit\?notice=unmapped$/);
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.locator("#lat")).toHaveValue("");
    await expect(page.locator("#lng")).toHaveValue("");

    // Clean up.
    await page.goto("/fr/admin/buildings");
    await page.locator("tr", { hasText: name }).locator('a[href*="/delete"]').click();
    await page.waitForURL(/\/delete$/);
    await page.locator("#confirmName").fill(name);
    await submitAndWait(page);
    await page.waitForURL(/\/fr\/admin\/buildings$/);
  });
});
