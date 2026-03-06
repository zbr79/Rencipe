import express from "express";
import {
  getWeeklyPlans,
  getWeeklyPlanById,
  createWeeklyPlan,
  updateMealSlot,
  deleteWeeklyPlan,
  renameWeeklyPlan,
  updateWeeklyPlanSettings,
} from "../controllers/weeklyplan.controller";

const router = express.Router();

// Get all weekly plans for a user
router.get("/", getWeeklyPlans);

// Create a new weekly plan
router.post("/", createWeeklyPlan);

// Get a single weekly plan
router.get("/:id", getWeeklyPlanById);

// Update a meal slot
router.patch("/:id/meals", updateMealSlot);

// Rename a weekly plan
router.patch("/:id/rename", renameWeeklyPlan);

// Update meal settings (which meals are enabled)
router.patch("/:id/settings", updateWeeklyPlanSettings);

// Delete a weekly plan
router.delete("/:id", deleteWeeklyPlan);

export default router;
