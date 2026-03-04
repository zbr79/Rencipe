import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  recipes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    recipes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
