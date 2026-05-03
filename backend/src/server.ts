import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import recipeRoutes from "./routes/recipe.routes";
import imageRoutes from "./routes/image.routes";
import draftRoutes from "./routes/draft.routes";
import cartRoutes from "./routes/cart.routes";
import favoriteRoutes from "./routes/favorite.routes";
import mealPlanRoutes from "./routes/mealplan.routes";
import weeklyPlanRoutes from "./routes/weeklyplan.routes";
dotenv.config();

const app = express();

// Multer setup for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = process.env.PORT || 6000;
// ...
app.use(recipeRoutes);
app.use(imageRoutes);
app.use("/drafts", draftRoutes);
app.use(cartRoutes);
app.use(favoriteRoutes);
app.use(mealPlanRoutes);
app.use("/weekly-plans", weeklyPlanRoutes);
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