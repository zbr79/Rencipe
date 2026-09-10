import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import authRoutes from "./routes/auth";
import draftRoutes from "./routes/draft";
import Recipe from "./models/Recipe";
import recipeRoutes from "./routes/recipe";
import savedRoutes from "./routes/saved";
import User from "./models/User";
import { signAuthToken, type AuthUser } from "./middleware/auth";

function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use(authRoutes);
  app.use(recipeRoutes);
  app.use("/drafts", draftRoutes);
  app.use(savedRoutes);
  return app;
}

function createUser(role: AuthUser["role"]) {
  return {
    _id: `api-test-${role}`,
    username: `api-test-${role}`,
    displayName: role,
    avatarUrl: "",
    email: "",
    phone: "",
    role,
    language: "en",
    languageLocked: false,
    projectMode: true,
  };
}

function createToken(role: AuthUser["role"]) {
  return signAuthToken({
    id: `api-test-${role}`,
    username: `api-test-${role}`,
    displayName: role,
    role,
    language: "en",
    languageLocked: false,
    projectMode: true,
  });
}

function createRecipeDocument(overrides: Record<string, unknown> = {}) {
  return {
    _id: "recipe-api-test",
    title: "API test recipe",
    subtitle: "",
    description: "A recipe used by request-level tests.",
    tips: "",
    recipeOrigin: "original",
    sharedSource: "",
    sharedSourceLink: "",
    image: null,
    imageFocus: undefined,
    authorId: "api-test-user",
    component: false,
    isPublic: false,
    mainIngredients: [],
    seasonings: [],
    steps: [],
    servings: 1,
    tags: [],
    likes: 0,
    views: 0,
    ratingAverage: 0,
    ratingCount: 0,
    language: "en",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    populate: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("backend API authorization boundaries", () => {
  const app = createApp();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes a health check without authentication", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns the authenticated user from a valid token", async () => {
    vi.spyOn(User, "findById").mockImplementation(
      () => Promise.resolve(createUser("admin")) as never,
    );

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${createToken("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      username: "api-test-admin",
      role: "admin",
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects invalid and missing tokens on protected endpoints", async () => {
    const endpoints = [
      request(app).get("/auth/me"),
      request(app).get("/saved"),
      request(app).put("/recipes/recipe-id"),
      request(app).get("/drafts"),
    ];

    for (const responsePromise of endpoints) {
      const response = await responsePromise;
      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/authentication required/i);
    }

    const invalidTokenResponse = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(invalidTokenResponse.status).toBe(401);
    expect(invalidTokenResponse.body.error).toBe("Invalid session");
  });

  it("blocks guest users from draft routes", async () => {
    vi.spyOn(User, "findById").mockImplementation(
      () => Promise.resolve(createUser("guest")) as never,
    );

    const response = await request(app)
      .get("/drafts")
      .set("Authorization", `Bearer ${createToken("guest")}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: "Create an account to do this",
      code: "ACCOUNT_REQUIRED",
    });
  });

  it("requires authentication before accepting recipe image-focus updates", async () => {
    const response = await request(app)
      .put("/recipes/recipe-id")
      .send({
        title: "Test recipe",
        imageFocus: {
          card: { x: 20, y: 30, zoom: 1.2 },
          hero: { x: 50, y: 50, zoom: 1 },
          detail: { x: 80, y: 70, zoom: 1.4 },
        },
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authentication required");
  });

  it("creates an authenticated recipe and normalizes its image focus", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const user = { ...createUser("user"), _id: userId };
    const createdRecipe = createRecipeDocument({ authorId: userId });
    const createSpy = vi.spyOn(Recipe, "create").mockResolvedValue(createdRecipe as never);
    vi.spyOn(User, "findById").mockImplementation(() => Promise.resolve(user) as never);

    const response = await request(app)
      .post("/recipes")
      .set("Authorization", `Bearer ${signAuthToken({
        id: userId,
        username: user.username,
        displayName: user.displayName,
        role: "user",
        language: "en",
        languageLocked: false,
        projectMode: true,
      })}`)
      .send({
        title: "API-created recipe",
        description: "Created through the request boundary.",
        imageFocus: {
          card: { x: 120, y: -10, zoom: 9 },
          hero: { x: 40, y: 60, zoom: 1.2 },
          detail: { x: 30, y: 70, zoom: 1.1 },
        },
      });

    expect(response.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: "API-created recipe",
      description: "Created through the request boundary.",
      authorId: expect.anything(),
      imageFocus: {
        card: { x: 100, y: 0, zoom: 2.5 },
        hero: { x: 40, y: 60, zoom: 1.2 },
        detail: { x: 30, y: 70, zoom: 1.1 },
      },
    }));
  });

  it("prevents a recipe owner from changing admin-only image focus", async () => {
    const existing = createRecipeDocument({ authorId: "api-test-user" });
    vi.spyOn(Recipe, "findById").mockResolvedValue(existing as never);
    vi.spyOn(User, "findById").mockImplementation(
      () => Promise.resolve(createUser("user")) as never,
    );

    const response = await request(app)
      .put("/recipes/recipe-api-test")
      .set("Authorization", `Bearer ${createToken("user")}`)
      .send({
        title: "Updated title",
        description: "Updated description",
        imageFocus: {
          card: { x: 20, y: 30, zoom: 1.2 },
          hero: { x: 50, y: 50, zoom: 1 },
          detail: { x: 80, y: 70, zoom: 1.4 },
        },
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Only admin accounts can adjust recipe image focus");
    expect(existing.save).not.toHaveBeenCalled();
  });

  it("allows an admin to update all image-focus surfaces", async () => {
    const existing = createRecipeDocument({ authorId: "someone-else" });
    vi.spyOn(Recipe, "findById").mockResolvedValue(existing as never);
    vi.spyOn(User, "findById").mockImplementation(
      () => Promise.resolve(createUser("admin")) as never,
    );

    const response = await request(app)
      .put("/recipes/recipe-api-test")
      .set("Authorization", `Bearer ${createToken("admin")}`)
      .send({
        title: "Admin updated title",
        description: "Admin updated description",
        imageFocus: {
          card: { x: 10, y: 20, zoom: 1.1 },
          hero: { x: 30, y: 40, zoom: 1.4 },
          detail: { x: 50, y: 60, zoom: 1.8 },
        },
      });

    expect(response.status).toBe(200);
    expect(existing.imageFocus).toEqual({
      card: { x: 10, y: 20, zoom: 1.1 },
      hero: { x: 30, y: 40, zoom: 1.4 },
      detail: { x: 50, y: 60, zoom: 1.8 },
    });
    expect(existing.save).toHaveBeenCalledOnce();
  });

  it("enforces ownership when deleting a recipe", async () => {
    const existing = createRecipeDocument({ authorId: "another-user" });
    vi.spyOn(Recipe, "findById").mockResolvedValue(existing as never);
    vi.spyOn(User, "findById").mockImplementation(
      () => Promise.resolve(createUser("user")) as never,
    );

    const response = await request(app)
      .delete("/recipes/recipe-api-test")
      .set("Authorization", `Bearer ${createToken("user")}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Not allowed to delete this recipe");
    expect(existing.save).not.toHaveBeenCalled();
  });
});
