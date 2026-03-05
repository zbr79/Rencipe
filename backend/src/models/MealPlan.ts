import mongoose, { Schema, Document } from "mongoose";

export interface IMealCombination {
  meatRecipeId: mongoose.Types.ObjectId;
  vegeRecipeId: mongoose.Types.ObjectId;
  sideRecipeId: mongoose.Types.ObjectId;
  portions: number;
}

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  numberOfPeople: number;
  numberOfDays: number;
  mealTypes: ('lunch' | 'dinner')[];
  totalMealsNeeded: number;
  combinations: IMealCombination[];
  checkedIngredients: string[];
  createdAt: Date;
  updatedAt: Date;
}

const mealCombinationSchema = new Schema<IMealCombination>(
  {
    meatRecipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    vegeRecipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    sideRecipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    portions: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

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
    numberOfPeople: {
      type: Number,
      required: true,
      min: 1,
    },
    numberOfDays: {
      type: Number,
      required: true,
      min: 1,
    },
    mealTypes: {
      type: [String],
      enum: ["lunch", "dinner"],
      required: true,
    },
    totalMealsNeeded: {
      type: Number,
      required: true,
      min: 1,
    },
    combinations: {
      type: [mealCombinationSchema],
      default: [],
    },
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
