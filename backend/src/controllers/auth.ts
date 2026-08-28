import { Request, Response } from "express";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import User, { UserLanguage } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { AuthUser, getAuthUser, signAuthToken } from "../middleware/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function pickUser(user: any): AuthUser {
  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role === "admin" ? "admin" : user.role === "guest" ? "guest" : "user",
    language: user.languageLocked ? "en" : normalizeLanguage(user.language),
    languageLocked: user.languageLocked === true,
    projectMode: user.projectMode !== false,
  };
}

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeLanguage(value: unknown): UserLanguage {
  return value === "zh" ? "zh" : "en";
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

export async function guestLogin(_req: Request, res: Response) {
  try {
    const { salt, hash } = hashPassword(crypto.randomBytes(24).toString("hex"));
    const username = `guest-${crypto.randomBytes(5).toString("hex")}`;
    const user = await User.create({
      username,
      displayName: "Guest",
      role: "guest",
      passwordSalt: salt,
      passwordHash: hash,
      projectMode: true,
    });
    const authUser = pickUser(user);
    res.json({ token: signAuthToken(authUser), user: authUser });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to create guest session" });
  }
}

export async function claimAccount(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Authentication required" });

    const user = await User.findById(authUser.id);
    if (!user) return res.status(401).json({ error: "Invalid session" });
    if (user.role !== "guest") return res.status(400).json({ error: "This session is already an account" });

    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const displayName = cleanText(req.body.displayName, user.displayName || "Guest");

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Username must be 3-20 characters (letters, numbers, underscore)" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ username });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const { salt, hash } = hashPassword(password);
    user.username = username;
    user.displayName = displayName;
    user.passwordSalt = salt;
    user.passwordHash = hash;
    user.role = "user";
    await user.save();

    const nextUser = pickUser(user);
    res.json({ token: signAuthToken(nextUser), user: nextUser });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to create account" });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Authentication required" });

    const user = await User.findById(authUser.id);
    if (!user) return res.status(401).json({ error: "Invalid session" });

    const displayName = cleanText(req.body.displayName, user.displayName);
    const avatarUrl = cleanText(req.body.avatarUrl, user.avatarUrl);
    const email = cleanText(req.body.email, user.email);
    const phone = cleanText(req.body.phone, user.phone);
    const language = user.languageLocked ? "en" : normalizeLanguage(req.body.language ?? user.language);
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!displayName) return res.status(400).json({ error: "display name is required" });

    user.displayName = displayName;
    user.avatarUrl = avatarUrl;
    user.email = email;
    user.phone = phone;
    user.language = language;

    if (authUser.role === "admin" && typeof req.body.projectMode === "boolean") {
      user.projectMode = req.body.projectMode;
    }

    if (authUser.role === "guest" && (newPassword || currentPassword)) {
      return res.status(403).json({ error: "Create an account to set a password", code: "ACCOUNT_REQUIRED" });
    }

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

export async function uploadAvatar(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Authentication required" });

    const user = await User.findById(authUser.id);
    if (!user) return res.status(401).json({ error: "Invalid session" });

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "image file is required" });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rencipe/users/${authUser.id}/avatar`,
        resource_type: "image",
        width: 256,
        height: 256,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
      async (error: any, result: any) => {
        if (error || !result?.secure_url) {
          return res.status(500).json({ error: "Failed to upload avatar" });
        }

        user.avatarUrl = result.secure_url;
        await user.save();

        const nextUser = pickUser(user);
        const token = signAuthToken(nextUser);
        res.json({ token, user: nextUser });
      }
    );

    uploadStream.end(file.buffer);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to upload avatar" });
  }
}
