import express from "express";
import { getFavorites, addFavorite, removeFavorite, addFavoriteMeal, removeFavoriteMeal } from "../controllers/saved.controller";

const router = express.Router();

router.get("/favorites", getFavorites);
router.post("/favorites/add", addFavorite);
router.post("/favorites/remove", removeFavorite);
router.post("/favorites/meals/add", addFavoriteMeal);
router.post("/favorites/meals/remove", removeFavoriteMeal);

export default router;
