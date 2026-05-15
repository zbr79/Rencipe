import mongoose, { Schema, Document } from "mongoose";

export type MealType = "breakfast" | "lunch" | "dinner";
export type MealEntryKind = "mealPlan" | "meal";

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

export interface IPlannedMeal {
  mealType: MealType;
  recipes: mongoose.Types.ObjectId[];
}

export interface IMealPlanDay {
  dayNumber: number;
  meals: IPlannedMeal[];
}

export interface IMealPlan extends Document {
  kind: MealEntryKind;
  userId: mongoose.Types.ObjectId;
  name: string;
  people: IPerson[];
  numberOfDays?: number;
  mealTypes?: MealType[];
  totalMealsNeeded?: number;
  days: IMealPlanDay[];
  recipes: mongoose.Types.ObjectId[];
  combinations: IMealCombination[];
  checkedIngredients: string[];
  isPublic: boolean;
  views: number;
  deletedAt?: Date | null;
  trashExpiresAt?: Date | null;
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

const plannedMealSchema = new Schema<IPlannedMeal>(
  {
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },
    recipes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
      default: [],
    },
  },
  { _id: false }
);

const mealPlanDaySchema = new Schema<IMealPlanDay>(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    meals: {
      type: [plannedMealSchema],
      default: [],
    },
  },
  { _id: false }
);

const mealPlanSchema = new Schema<IMealPlan>(
  {
    kind: {
      type: String,
      enum: ["mealPlan", "meal"],
      required: true,
      default: "meal",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
      min: 1,
    },
    mealTypes: {
      type: [String],
      enum: ["breakfast", "lunch", "dinner"],
    },
    totalMealsNeeded: {
      type: Number,
      min: 0,
    },
    days: {
      type: [mealPlanDaySchema],
      default: [],
    },
    recipes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
      default: [],
    },
    combinations: {
      type: [mealCombinationSchema],
      default: [],
    },
    checkedIngredients: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    deletedAt: {
      type: Date,
      default: undefined,
      index: true,
    },
    trashExpiresAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

// Ensure each user can have multiple plans
mealPlanSchema.index({ userId: 1, createdAt: -1 });
mealPlanSchema.index({ kind: 1, isPublic: 1, createdAt: -1 });
mealPlanSchema.index(
  { trashExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { trashExpiresAt: { $type: "date" } } }
);

export default mongoose.model<IMealPlan>("MealPlan", mealPlanSchema);
