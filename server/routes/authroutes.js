import express from "express";
import { signup, login } from "../controllers/authControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/dashboard", protect, (req, res) => {
  res.json({ message: "Welcome to Dashboard" });
});

export default router;