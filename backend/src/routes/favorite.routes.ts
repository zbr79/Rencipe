import express from "express";
import { getFavorites, addFavorite, removeFavorite } from "../controllers/favorite.controller";

const router = express.Router();

router.get("/favorites", getFavorites);
router.post("/favorites/add", addFavorite);
router.post("/favorites/remove", removeFavorite);

export default router;
