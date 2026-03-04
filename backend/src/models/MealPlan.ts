import mongoose, { Schema, Document } from "mongoose";

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  recipes: mongoose.Types.ObjectId[];
  checkedIngredients: string[];
  createdAt: Date;
  updatedAt: Date;
}

const mealPlanSchema = new Schema<IMealPlan>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      default: "新建计划",
    },
    recipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
    checkedIngredients: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Ensure each user can have multiple meal plans
mealPlanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IMealPlan>("MealPlan", mealPlanSchema);
