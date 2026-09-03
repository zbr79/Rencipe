import mongoose, { Schema, Document } from "mongoose";

export type RecipeLanguage = "en" | "zh";

export interface IRecipe extends Document {
  title: string;
  subtitle?: string;
  description: string;
  tips?: string;
  recipeOrigin: "original" | "shared";
  sharedSource?: string;
  sharedSourceLink?: string;
  authorId: mongoose.Types.ObjectId;
  image?: string;
  language: RecipeLanguage;
  component: boolean;
  isPublic: boolean;
  deletedAt?: Date | null;
  trashExpiresAt?: Date | null;

  mainIngredients: {
    name: string;
    quantity: string;
  }[];

  seasonings: {
    name: string;
    quantity: string;
  }[];

  steps: {
    stepNumber: number;
    instruction: string;
    image?: string;
  }[];

  servings: number;

  tags: string[];

  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    tips: { type: String, trim: true },
    recipeOrigin: {
      type: String,
      enum: ["original", "shared"],
      default: "original",
    },
    sharedSource: {
      type: String,
      trim: true,
      required(this: IRecipe) {
        return this.recipeOrigin === "shared";
      },
    },
    sharedSourceLink: {
      type: String,
      trim: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    image: String,
    language: { type: String, enum: ["en", "zh"], default: "en", index: true },
    component: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    deletedAt: { type: Date, default: undefined, index: true },
    trashExpiresAt: { type: Date, default: undefined },

    mainIngredients: [
      {
        name: String,
        quantity: String,
      },
    ],

    seasonings: [
      {
        name: String,
        quantity: String,
      },
    ],

    steps: [
      {
        stepNumber: Number,
        instruction: String,
        image: String,
      },
    ],

    servings: Number,

    tags: [String],

    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RecipeSchema.index(
  { trashExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { trashExpiresAt: { $type: "date" } } }
);

export default mongoose.models.Recipe || mongoose.model<IRecipe>("Recipe", RecipeSchema);
