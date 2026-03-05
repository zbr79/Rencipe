import mongoose, { Schema, Document } from "mongoose";

export interface IRecipe extends Document {
  title: string;
  description: string;
  authorId: mongoose.Types.ObjectId;
  image?: string; // Cloudinary image URL
  component: boolean; // Can be used as a component in meal prep

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
    image?: string; // Cloudinary image URL for step
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
    description: { type: String, required: true, trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    image: String,
    component: { type: Boolean, default: false }, // Can be used as a component in meal prep

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

export default mongoose.models.Recipe || mongoose.model<IRecipe>("Recipe", RecipeSchema);