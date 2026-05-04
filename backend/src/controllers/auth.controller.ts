import { Request, Response } from "express";
import User from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { getAuthUser, signAuthToken } from "../middleware/auth";

function pickUser(user: any) {
  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    email: user.email || "",
    phone: user.phone || "",
    role: user.role,
  };
}

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
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

export async function updateProfile(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Authentication required" });

    const user = await User.findById(authUser.id);
    if (!user) return res.status(401).json({ error: "Invalid session" });

    const displayName = cleanText(req.body.displayName, user.displayName);
    const email = cleanText(req.body.email);
    const phone = cleanText(req.body.phone);
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!displayName) return res.status(400).json({ error: "display name is required" });

    user.displayName = displayName;
    user.email = email;
    user.phone = phone;

    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ error: "new password must be at least 6 characters" });
      if (!currentPassword || !verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
        return res.status(400).json({ error: "current password is incorrect" });
      }

      const { salt, hash } = hashPassword(newPassword);
      user.passwordSalt = salt;
      user.passwordHash = hash;
    }

    await user.save();

    const nextUser = pickUser(user);
    const token = signAuthToken(nextUser);
    res.json({ token, user: nextUser });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to update profile" });
  }
}
