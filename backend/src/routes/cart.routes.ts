import express from "express";
import { getCart, addToCart, removeFromCart, clearCart } from "../controllers/cart.controller";

const router = express.Router();

router.get("/carts", getCart);
router.post("/carts/add", addToCart);
router.post("/carts/remove", removeFromCart);
router.post("/carts/clear", clearCart);

export default router;
