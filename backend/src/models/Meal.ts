import mongoose, { Schema, Document } from "mongoose";

export type MealType = "breakfast" | "lunch" | "dinner";
export type MealEntryKind = "meal";

export interface IPerson {
  name: string;
  modifier: number;
}

export interface IMealSlot {
  mealType: MealType;
  recipes: mongoose.Types.ObjectId[];
}

export interface IMealDay {
  dayNumber: number;
  meals: IMealSlot[];
}

export interface IMeal extends Document {
  kind: MealEntryKind;
  userId: mongoose.Types.ObjectId;
  name: string;
  people: IPerson[];
  numberOfDays?: number;
  mealTypes?: MealType[];
  totalMealsNeeded?: number;
  days: IMealDay[];
  recipes: mongoose.Types.ObjectId[];
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

const mealSlotSchema = new Schema<IMealSlot>(
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

const mealDaySchema = new Schema<IMealDay>(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    meals: {
      type: [mealSlotSchema],
      default: [],
    },
  },
  { _id: false }
);

const mealSchema = new Schema<IMeal>(
  {
    kind: {
      type: String,
      enum: ["meal"],
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
        message: "Meal must have at least one person",
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
      type: [mealDaySchema],
      default: [],
    },
    recipes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
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

mealSchema.index({ userId: 1, createdAt: -1 });
mealSchema.index({ kind: 1, isPublic: 1, createdAt: -1 });
mealSchema.index(
  { trashExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { trashExpiresAt: { $type: "date" } } }
);

export default mongoose.model<IMeal>("MealPlan", mealSchema);
