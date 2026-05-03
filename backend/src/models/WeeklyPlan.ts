import mongoose, { Schema, Document } from "mongoose";
import { IRecipe } from "./Recipe";

export interface IDayPlan {
  dayOfWeek: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  breakfast: mongoose.Types.ObjectId[];
  lunch: mongoose.Types.ObjectId[];
  dinner: mongoose.Types.ObjectId[];
}

export interface IWeeklyPlan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  days: IDayPlan[];
  breakfastEnabled: boolean;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DayPlanSchema = new Schema({
  dayOfWeek: {
    type: String,
    enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    required: true,
  },
  breakfast: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Recipe",
    },
  ],
  lunch: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Recipe",
    },
  ],
  dinner: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Recipe",
    },
  ],
});

const WeeklyPlanSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      default: "My Scheduled Meal Plan",
    },
    breakfastEnabled: {
      type: Boolean,
      default: true,
    },
    lunchEnabled: {
      type: Boolean,
      default: true,
    },
    dinnerEnabled: {
      type: Boolean,
      default: true,
    },
    days: [DayPlanSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWeeklyPlan>("WeeklyPlan", WeeklyPlanSchema);
