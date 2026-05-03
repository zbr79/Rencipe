import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "user";

export interface IUser extends Document {
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "user"], default: "user", required: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
