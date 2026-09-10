import { expect, test } from "@playwright/test";

const TEST_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='100%25' height='100%25' fill='%23d8a15d'/%3E%3C/svg%3E";
const TEST_RECIPES = [{
  id: "visual-recipe-1",
  _id: "visual-recipe-1",
  title: "Visual Recipe",
  subtitle: "Stable visual fixture",
  description: "A stable recipe fixture for visual regression tests.",
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
      token: "playwright-visual-token",
      user: {
        id: "playwright-visual-guest",
        username: "playwright-visual-guest",
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
      id: "playwright-visual-guest",
      username: "playwright-visual-guest",
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
    body: JSON.stringify({ token: "playwright-visual-token", user: {
      id: "playwright-visual-guest",
      username: "playwright-visual-guest",
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

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`homepage ${viewport.name} layout matches the visual baseline`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockPublicApis(page);
    await page.goto("/");
    await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    });
  });
}
