import type { Page } from "@playwright/test";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./admin";

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/fr/admin/login");
  await page.locator("#email").fill(E2E_ADMIN_EMAIL);
  await page.locator("#password").fill(E2E_ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/fr\/admin\/buildings$/);
}
