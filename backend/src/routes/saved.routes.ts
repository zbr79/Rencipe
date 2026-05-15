import express from "express";
import { getFavorites, addFavorite, removeFavorite, addFavoriteMeal, removeFavoriteMeal } from "../controllers/saved.controller";

const router = express.Router();

router.get("/saved", getFavorites);
router.post("/saved/add", addFavorite);
router.post("/saved/remove", removeFavorite);
router.post("/saved/meals/add", addFavoriteMeal);
router.post("/saved/meals/remove", removeFavoriteMeal);

export default router;
