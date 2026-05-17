
import mongoose, { Schema, Document } from "mongoose";

export type DraftType = "recipe" | "meal";

export interface IDraftPerson {
  name: string;
  modifier: number;
}

export interface IDraft extends Document {
  authorId: mongoose.Types.ObjectId;
  draftType: DraftType;
  name: string;
  title: string;
  description: string;
  tips?: string;
  recipeOrigin: "original" | "shared";
  sharedSource?: string;
  sharedSourceLink?: string;
  image?: string;
  component: boolean;
  isPublic: boolean;
  mainIngredients: Array<{ name: string; quantity: string }>;
  seasonings: Array<{ name: string; quantity: string }>;
  steps: Array<{ stepNumber: number; instruction: string; image?: string }>;
  servings: number;
  tags: string[];
  people: IDraftPerson[];
  recipes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const draftPersonSchema = new Schema<IDraftPerson>(
  {
    name: { type: String, default: "" },
    modifier: { type: Number, default: 1, min: 0.1, max: 5 },
  },
  { _id: false }
);

const DraftSchema = new Schema<IDraft>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    draftType: { type: String, enum: ["recipe", "meal"], default: "recipe", index: true },
    name: { type: String, required: true, default: "Untitled Draft" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    tips: { type: String, default: "" },
    recipeOrigin: { type: String, enum: ["original", "shared"], default: "original" },
    sharedSource: { type: String, default: "" },
    sharedSourceLink: { type: String, default: "" },
    image: { type: String, default: undefined },
    component: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
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
    people: { type: [draftPersonSchema], default: [] },
    recipes: { type: [{ type: Schema.Types.ObjectId, ref: "Recipe" }], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IDraft>("Draft", DraftSchema);
