import mongoose, { Schema, Document } from "mongoose";

export interface IPerson {
  name: string;
  modifier: number; // Individual eating modifier (0.5 = 50%, 1.0 = 100%, 1.8 = 180%)
}

export interface IMealCombination {
  meatRecipeId: mongoose.Types.ObjectId;
  vegeRecipeId: mongoose.Types.ObjectId;
  sideRecipeId: mongoose.Types.ObjectId;
  portions: number;
}

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  people: IPerson[];
  numberOfDays: number;
  mealTypes: ('lunch' | 'dinner')[];
  totalMealsNeeded: number;
  combinations: IMealCombination[];
  checkedIngredients: string[];
  createdAt: Date;
  updatedAt: Date;
}

const personSchema = new Schema<IPerson>(
  {
    name: {
      type: String,
      required: true,
    },
    modifier: {
      type: Number,
      required: true,
      default: 1.0,
      min: 0.1,
      max: 5.0,
    },
  },
  { _id: false }
);

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
    people: {
      type: [personSchema],
      required: true,
      validate: {
        validator: function(v: IPerson[]) {
          return v.length > 0;
        },
        message: "Plan must have at least one person",
      },
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
