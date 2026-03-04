import mongoose, { Schema, Document } from "mongoose";

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  recipes: mongoose.Types.ObjectId[];
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
  },
  { timestamps: true }
);

// Ensure each user can have multiple meal plans
mealPlanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IMealPlan>("MealPlan", mealPlanSchema);
