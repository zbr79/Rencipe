import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  recipes: mongoose.Types.ObjectId[];
  meals: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
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

const Favorite = mongoose.model<IFavorite>("Favorite", FavoriteSchema);

export default Favorite;
