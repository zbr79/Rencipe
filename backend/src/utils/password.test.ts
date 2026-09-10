import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies a password using its generated salt and hash", () => {
    const credentials = hashPassword("correct horse battery staple");

    expect(verifyPassword("correct horse battery staple", credentials.salt, credentials.hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const credentials = hashPassword("correct horse battery staple");

    expect(verifyPassword("wrong password", credentials.salt, credentials.hash)).toBe(false);
  });

  it("generates a different salt for separate passwords", () => {
    const first = hashPassword("same password");
    const second = hashPassword("same password");

    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });
});
