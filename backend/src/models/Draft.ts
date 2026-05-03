import mongoose, { Schema, Document } from "mongoose";

export interface IDraft extends Document {
  authorId: mongoose.Types.ObjectId;
  name: string; // Draft name (e.g., "My First Recipe", "Pasta Ideas")
  title: string;
  description: string;
  image?: string;
  component: boolean;
  mainIngredients: Array<{ name: string; quantity: string }>;
  seasonings: Array<{ name: string; quantity: string }>;
  steps: Array<{ stepNumber: number; instruction: string; image?: string }>;
  servings: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DraftSchema = new Schema<IDraft>(
  {
    authorId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, default: "Untitled Draft" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: undefined },
    component: { type: Boolean, default: false },
    mainIngredients: [
      {
        name: { type: String, default: "" },
        quantity: { type: String, default: "" },
      },
    ],
    seasonings: [
      {
        name: { type: String, default: "" },
        quantity: { type: String, default: "" },
      },
    ],
    steps: [
      {
        stepNumber: { type: Number, required: true },
        instruction: { type: String, default: "" },
        image: { type: String, default: undefined },
      },
    ],
    servings: { type: Number, default: 1 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IDraft>("Draft", DraftSchema);
