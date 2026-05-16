// Defines each user's saved recipes and saved meals collection.
import mongoose, { Schema, Document } from "mongoose";

export interface ISavedCollection extends Document {
  userId: mongoose.Types.ObjectId;
  recipes: mongoose.Types.ObjectId[];
  meals: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const savedSchema = new Schema<ISavedCollection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    recipes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
    meals: [
      {
        type: Schema.Types.ObjectId,
        ref: "MealPlan",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Saved = mongoose.model<ISavedCollection>("Favorite", savedSchema);

export default Saved;
