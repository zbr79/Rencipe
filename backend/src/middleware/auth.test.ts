import { describe, expect, it, vi } from "vitest";
import User from "../models/User";
import {
  requireAccount,
  requireAuth,
  signAuthToken,
  type AuthUser,
} from "./auth";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function createUser(role: "admin" | "user" | "guest") {
  return {
    _id: `user-${role}`,
    username: role,
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
    id: `user-${role}`,
    username: role,
    displayName: role,
    role,
    language: "en",
    languageLocked: false,
    projectMode: true,
  });
}

describe("authentication middleware", () => {
  it("rejects requests without a bearer token", async () => {
    const response = createResponse();
    const next = vi.fn();

    await requireAuth({ headers: {} } as never, response as never, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid bearer tokens", async () => {
    const response = createResponse();
    const next = vi.fn();

    await requireAuth(
      { headers: { authorization: "Bearer invalid-token" } } as never,
      response as never,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Invalid session" });
    expect(next).not.toHaveBeenCalled();
  });

  it("loads the current user for a valid token", async () => {
    const response = createResponse();
    const next = vi.fn();
    const findById = vi.spyOn(User, "findById").mockImplementation(
      () => Promise.resolve(createUser("admin")) as never,
    );
    const request = { headers: { authorization: `Bearer ${createToken("admin")}` } } as Record<string, unknown>;

    await requireAuth(request as never, response as never, next);

    expect(findById).toHaveBeenCalledWith("user-admin");
    expect(request.authUser).toMatchObject({ username: "admin", role: "admin" });
    expect(next).toHaveBeenCalledOnce();
    findById.mockRestore();
  });

  it("blocks guests from account-only routes", async () => {
    const response = createResponse();
    const next = vi.fn();
    const findById = vi.spyOn(User, "findById").mockImplementation(
      () => Promise.resolve(createUser("guest")) as never,
    );

    await requireAccount(
      { headers: { authorization: `Bearer ${createToken("guest")}` } } as never,
      response as never,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: "Create an account to do this",
      code: "ACCOUNT_REQUIRED",
    });
    expect(next).not.toHaveBeenCalled();
    findById.mockRestore();
  });

  it("allows regular users and admins through account-only routes", async () => {
    for (const role of ["user", "admin"] as const) {
      const response = createResponse();
      const next = vi.fn();
      const findById = vi.spyOn(User, "findById").mockImplementation(
        () => Promise.resolve(createUser(role)) as never,
      );

      await requireAccount(
        { headers: { authorization: `Bearer ${createToken(role)}` } } as never,
        response as never,
        next,
      );

      expect(next).toHaveBeenCalledOnce();
      expect(response.status).not.toHaveBeenCalled();
      findById.mockRestore();
    }
  });
});
