import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { UserLanguage, UserRole } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "rencipe-local-development-secret";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production.");
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  language: UserLanguage;
  projectMode: boolean;
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function authenticateOptional(req: Request, _res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await User.findById(decoded.id);
    if (user) {
      (req as any).authUser = {
        id: String(user._id),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        language: user.language === "zh" ? "zh" : "en",
        projectMode: user.projectMode !== false,
      } satisfies AuthUser;
    }
  } catch {
    // Optional auth intentionally falls back to public access.
  }

  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "Invalid session" });

    (req as any).authUser = {
      id: String(user._id),
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      language: user.language === "zh" ? "zh" : "en",
      projectMode: user.projectMode !== false,
    } satisfies AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

export function getAuthUser(req: Request): AuthUser | null {
  return ((req as any).authUser as AuthUser | undefined) || null;
}
