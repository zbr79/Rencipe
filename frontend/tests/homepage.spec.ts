import { expect, test } from "@playwright/test";

test("public homepage loads its core controls without an account", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Rencipe/i);
  await expect(page.getByRole("heading", { name: "Kitchen converter" })).toBeVisible();

  for (const label of ["Recommended", "New", "Quick", "Health"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }

  await expect(page.getByRole("link", { name: "About" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Legal" })).toBeVisible();
});
