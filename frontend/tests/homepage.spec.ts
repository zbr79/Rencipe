import { expect, test } from "@playwright/test";

test("public homepage loads its core controls without an account", async ({ page }) => {
  await page.route("**/api/auth/guest", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      token: "playwright-home-token",
      user: {
        id: "playwright-home-guest",
        username: "playwright-home-guest",
        displayName: "Guest",
        role: "guest",
        language: "en",
        languageLocked: false,
        projectMode: true,
      },
    }),
  }));
  await page.route("**/api/auth/me", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ user: null }),
  }));
  await page.route("**/api/recipes**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ recipes: [] }),
  }));
  await page.route("**/api/saved**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ recipes: [], meals: [] }),
  }));

  const response = await page.goto("/");

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Rencipe/i);
  await expect(page.getByRole("heading", { name: "Kitchen converter" })).toBeVisible({ timeout: 15_000 });

  for (const label of ["Recommended", "New", "Quick", "Health"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }

  await expect(page.getByRole("link", { name: "About" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Legal" })).toBeVisible();
});
