import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TEST_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='100%25' height='100%25' fill='%23d8a15d'/%3E%3C/svg%3E";
const TEST_RECIPES = [{
  id: "a11y-recipe-1",
  _id: "a11y-recipe-1",
  title: "Accessibility Recipe",
  subtitle: "A recipe fixture",
  description: "A recipe fixture for accessibility checks.",
  image: TEST_IMAGE,
  authorId: null,
  author: null,
  servings: 2,
  tags: ["quick"],
  likes: 0,
  views: 0,
  ratingAverage: 0,
  ratingCount: 0,
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  isPublic: true,
}];

async function mockPublicApis(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("rencipe-auth-session", JSON.stringify({
      token: "playwright-a11y-token",
      user: {
        id: "playwright-a11y-guest",
        username: "playwright-a11y-guest",
        displayName: "Guest",
        role: "guest",
        language: "en",
        languageLocked: false,
        projectMode: true,
      },
      signedInAt: new Date().toISOString(),
    }));
  });

  await page.route("**/api/auth/me", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ user: {
      id: "playwright-a11y-guest",
      username: "playwright-a11y-guest",
      displayName: "Guest",
      role: "guest",
      language: "en",
      languageLocked: false,
      projectMode: true,
    } }),
  }));
  await page.route("**/api/auth/guest", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ token: "playwright-a11y-token", user: {
      id: "playwright-a11y-guest",
      username: "playwright-a11y-guest",
      displayName: "Guest",
      role: "guest",
      language: "en",
      languageLocked: false,
      projectMode: true,
    } }),
  }));
  await page.route("**/api/recipes**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ recipes: TEST_RECIPES }),
  }));
  await page.route("**/api/saved**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ recipes: [], meals: [] }),
  }));
  await page.route("**/api/meals**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ meals: [] }),
  }));
}

for (const route of ["/", "/browse", "/about"]) {
  test(`${route} has no serious automated accessibility violations`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockPublicApis(page);
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("search dialog supports keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicApis(page);
  await page.goto("/");

  await page.locator(
    'button[aria-label="Open search"]:visible, button[aria-label="Search recipes"]:visible',
  ).first().click();
  const dialog = page.getByRole("dialog", { name: "Search recipes" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
