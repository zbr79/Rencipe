import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import recipeRoutes from "./routes/recipe.routes";
import draftRoutes from "./routes/draft.routes";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
app.use(express.json());
// Recipe routes
app.use("/recipes", recipeRoutes);
// Draft routes
app.use("/drafts", draftRoutes);
app.get("/health", (_req, res) => {
  res.json({ status: "ok", backend: "running" });
});

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });