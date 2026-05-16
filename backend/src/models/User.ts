// Defines users, profile fields, auth roles, language preference, and password storage.
import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "user";
export type UserLanguage = "en" | "zh";

export interface IUser extends Document {
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  language: UserLanguage;
  projectMode: boolean;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["admin", "user"], default: "user", required: true },
    language: { type: String, enum: ["en", "zh"], default: "en", required: true },
    projectMode: { type: Boolean, default: true, required: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
