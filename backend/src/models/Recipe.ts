import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 20000 },

    // optional for later
    uploadedBy: { type: String, required: false }, // userId
    source: { type: String, required: false }, // original source URL/string
  },
  { timestamps: true }
);

export default mongoose.models.Recipe || mongoose.model("Recipe", RecipeSchema);