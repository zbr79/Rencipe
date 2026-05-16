// Starts the Express API, connects MongoDB, and mounts all backend routes.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import recipeRoutes from "./routes/recipe";
import draftRoutes from "./routes/draft";
import savedRoutes from "./routes/saved";
import mealRoutes from "./routes/meal";
import authRoutes from "./routes/auth";
import commentRoutes from "./routes/comment";
dotenv.config();

const app = express();

// Multer setup for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = process.env.PORT || 6000;
// ...
app.use(authRoutes);
app.use(recipeRoutes);
app.use("/drafts", draftRoutes);
app.use(savedRoutes);
app.use(mealRoutes);
app.use(commentRoutes);
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