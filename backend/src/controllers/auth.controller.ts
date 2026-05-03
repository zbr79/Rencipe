import { Request, Response } from "express";
import User from "../models/User";
import { verifyPassword } from "../utils/password";
import { getAuthUser, signAuthToken } from "../middleware/auth";

function pickUser(user: any) {
  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function login(req: Request, res: Response) {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const authUser = pickUser(user);
    const token = signAuthToken(authUser);
    res.json({ token, user: authUser });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to log in" });
  }
}

export async function me(req: Request, res: Response) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  res.json({ user });
}
