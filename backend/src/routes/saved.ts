


import express from "express";
import { getSavedItems, saveRecipe, unsaveRecipe, saveMeal, unsaveMeal } from "../controllers/saved";



const router = express.Router();



router.get("/saved", getSavedItems);
router.post("/saved/add", saveRecipe);
router.post("/saved/remove", unsaveRecipe);
router.post("/saved/meals/add", saveMeal);
router.post("/saved/meals/remove", unsaveMeal);



export default router;
