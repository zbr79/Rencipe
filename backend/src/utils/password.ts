
import crypto from "crypto";

const ITERATIONS = 12000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = hashPassword(password, salt);
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hash, "hex");

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
