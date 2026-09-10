import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "320px phone", width: 320, height: 800 },
  { name: "360px phone", width: 360, height: 800 },
  { name: "375px phone", width: 375, height: 667 },
  { name: "390px phone", width: 390, height: 844 },
  { name: "430px phone", width: 430, height: 932 },
  { name: "768px tablet", width: 768, height: 1024 },
  { name: "820px tablet", width: 820, height: 1180 },
  { name: "899px tablet", width: 899, height: 1200 },
  { name: "1024px desktop", width: 1024, height: 768 },
  { name: "1280px desktop", width: 1280, height: 800 },
  { name: "1440px desktop", width: 1440, height: 900 },
] as const;

const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/browse", name: "browse" },
  { path: "/search", name: "search" },
  { path: "/saved", name: "saved" },
  { path: "/about", name: "about" },
  { path: "/legal", name: "legal" },
  { path: "/contact", name: "contact" },
] as const;

const TEST_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='100%25' height='100%25' fill='%23d8a15d'/%3E%3C/svg%3E";
const TEST_RECIPES = [
  {
    id: "test-recipe-1",
    _id: "test-recipe-1",
    title: "Test Recipe One",
    subtitle: "A responsive test recipe",
    description: "A recipe fixture for public UI testing.",
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
  },
  {
    id: "test-recipe-2",
    _id: "test-recipe-2",
    title: "Test Recipe Two",
    subtitle: "Another responsive test recipe",
    description: "A second recipe fixture for slideshow and card checks.",
    image: TEST_IMAGE,
    authorId: null,
    author: null,
    servings: 4,
    tags: ["health"],
    likes: 0,
    views: 0,
    ratingAverage: 0,
    ratingCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    isPublic: true,
  },
];

const DETAIL_RECIPE = {
  ...TEST_RECIPES[0],
  tips: "Serve immediately.",
  mainIngredients: [{ name: "Rice", quantity: 1, unit: "cup", note: "" }],
  seasonings: [{ name: "Salt", quantity: 1, unit: "tsp", note: "" }],
  steps: [{ stepNumber: 1, instruction: "Cook until ready.", image: "" }],
  imageFocus: {
    card: { x: 50, y: 50, zoom: 1 },
    hero: { x: 50, y: 50, zoom: 1 },
    detail: { x: 50, y: 50, zoom: 1 },
  },
};

async function mockPublicApis(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("rencipe-auth-session", JSON.stringify({
      token: "playwright-test-token",
      user: {
        id: "playwright-guest",
        username: "playwright-guest",
        displayName: "Guest",
        role: "guest",
        language: "en",
        languageLocked: false,
        projectMode: true,
      },
      signedInAt: new Date().toISOString(),
    }));
  });

  await page.route("**/api/auth/guest", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      token: "playwright-test-token",
      user: {
        id: "playwright-guest",
        username: "playwright-guest",
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
    body: JSON.stringify({ user: {
      id: "playwright-guest",
      username: "playwright-guest",
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

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page, label: string) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    dimensions.scrollWidth,
    `${label} has horizontal overflow: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test.describe.configure({ mode: "parallel" });

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} keeps every public route within the viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockPublicApis(page);

    for (const route of PUBLIC_ROUTES) {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${route.name} did not return a response`).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      await expectNoHorizontalOverflow(page, `${viewport.name} ${route.name}`);

      const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
      if (viewport.width <= 767) {
        await expect(mobileNavigation).toBeVisible();
        for (const label of ["Home", "Browse", "Saved", "Settings", "Me"]) {
          await expect(mobileNavigation.getByText(label, { exact: true })).toBeVisible();
        }
      } else {
        await expect(mobileNavigation).toBeHidden();
      }

      await expect(page.getByRole("navigation", { name: "Site information" })).toBeAttached();
    }
  });
}

test("homepage filters update the URL on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicApis(page);
  await page.goto("/");

  await page.getByRole("button", { name: "New", exact: true }).click();
  await expect(page).toHaveURL(/tab=newest/);

  await page.getByRole("button", { name: "Health", exact: true }).click();
  await expect(page).toHaveURL(/tab=health/);
});

test("search modal opens and closes at phone and desktop sizes", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await mockPublicApis(page);
    await page.goto("/");

    const searchButton = page.locator(
      'button[aria-label="Open search"]:visible, button[aria-label="Search recipes"]:visible',
    ).first();
    await searchButton.click();
    const dialog = page.getByRole("dialog", { name: "Search recipes" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder("Search recipes")).toBeVisible();
    await expectNoHorizontalOverflow(page, `search modal at ${viewport.width}px`);

    await dialog.getByRole("button", { name: "Close search" }).click();
    await expect(dialog).toBeHidden();
  }
});

test("browse sort control toggles without becoming a native select", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await mockPublicApis(page);
  await page.goto("/browse");

  const sortButton = page.getByRole("button", { name: "Sort by most recent" });
  await expect(sortButton).toHaveText(/Most Popular/);
  await sortButton.click();
  await expect(page.getByRole("button", { name: "Sort by most popular" })).toHaveText(/Most Recent/);
  await expect(page.locator("select")).toHaveCount(0);
});

test("kitchen converter handles invalid and empty amounts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockPublicApis(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Kitchen converter" })).toBeVisible();
  const fromAmount = page.locator('input[aria-label="From amount"]:visible').first();
  const toAmount = page.locator('input[aria-label="To amount"]:visible').first();
  await expect(fromAmount).toHaveValue("1");

  await fromAmount.fill("abc");
  await expect(page.getByText("Enter a valid amount", { exact: true })).toBeVisible();
  await expect(toAmount).toHaveValue("");

  await fromAmount.fill("");
  await expect(page.getByText("Enter an amount", { exact: true })).toBeVisible();
  await expect(toAmount).toHaveValue("");
});

test("guest Me navigation opens the sign-in modal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicApis(page);
  await page.goto("/");

  const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await mobileNavigation.getByText("Me", { exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
});

test("recipe detail renders ingredients, steps, metadata, and save control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicApis(page);
  await page.route("**/api/recipes/test-recipe-1", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ recipe: DETAIL_RECIPE }),
  }));
  await page.route("**/api/comments/recipe/test-recipe-1", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      comments: [{
        _id: "comment-1",
        displayName: "Demo cook",
        text: "A public demo comment.",
        upvotes: 3,
        upvotedByCurrentUser: false,
        isOwn: false,
        canDelete: false,
        createdAt: "2026-01-03T00:00:00.000Z",
      }],
    }),
  }));
  await page.goto("/recipes/test-recipe-1");

  await expect(page.getByRole("heading", { name: "Test Recipe One" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ingredients", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Steps", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reviews", exact: true })).toBeVisible();
  await expect(page.getByText("Rate this recipe", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rate 5 stars" })).toBeVisible();
  await expect(page.getByText("A public demo comment.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Like comment" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Save recipe|Unsave recipe/ })).toBeVisible();
  await expectNoHorizontalOverflow(page, "recipe detail at 390px");
});

test("signed-in users retain the comment like action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicApis(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("rencipe-auth-session", JSON.stringify({
      token: "playwright-user-token",
      user: {
        id: "playwright-user",
        username: "playwright-user",
        displayName: "User",
        role: "user",
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
      id: "playwright-user",
      username: "playwright-user",
      displayName: "User",
      role: "user",
      language: "en",
      languageLocked: false,
      projectMode: true,
    } }),
  }));
  await page.route("**/api/recipes/test-recipe-1", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ recipe: DETAIL_RECIPE }),
  }));
  await page.route("**/api/comments/recipe/test-recipe-1", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      comments: [{
        _id: "comment-1",
        displayName: "Demo cook",
        text: "A public demo comment.",
        upvotes: 3,
        upvotedByCurrentUser: false,
        isOwn: false,
        canDelete: false,
        createdAt: "2026-01-03T00:00:00.000Z",
      }],
    }),
  }));
  await page.goto("/recipes/test-recipe-1");

  await expect(page.getByRole("heading", { name: "Reviews", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Like comment" })).toBeVisible();
});

test("admin image-focus editor saves independent display areas", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockPublicApis(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("rencipe-auth-session", JSON.stringify({
      token: "playwright-admin-token",
      user: {
        id: "playwright-admin",
        username: "playwright-admin",
        displayName: "Admin",
        role: "admin",
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
      id: "playwright-admin",
      username: "playwright-admin",
      displayName: "Admin",
      role: "admin",
      language: "en",
      languageLocked: false,
      projectMode: true,
    } }),
  }));
  await page.route("**/api/recipes/test-recipe-1", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ recipe: DETAIL_RECIPE }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ recipe: DETAIL_RECIPE }),
    });
  });

  const updateRequest = page.waitForRequest(
    (request) => request.url().includes("/api/recipes/test-recipe-1") && request.method() === "PUT",
  );

  await page.goto("/edit/test-recipe-1");
  await page.getByRole("button", { name: "Adjust image focus" }).click();
  const editor = page.getByRole("dialog", { name: /Adjust image focus/ });
  await expect(editor).toBeVisible();
  await editor.getByRole("tab", { name: "Recipe card" }).click();
  await editor.getByRole("tab", { name: "Home slideshow" }).click();
  await editor.getByRole("tab", { name: "Detail page" }).click();
  await editor.locator('input[type="range"]').fill("1.25");
  await editor.getByRole("button", { name: "Save focus" }).click();

  const body = JSON.parse((await updateRequest).postData() || "{}");
  expect(body.imageFocus).toEqual({
    card: { x: 50, y: 50, zoom: 1 },
    hero: { x: 50, y: 50, zoom: 1 },
    detail: { x: 50, y: 50, zoom: 1.25 },
  });
});
