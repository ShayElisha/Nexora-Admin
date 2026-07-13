import express from "express";
import {
  loginUser,
  logout,
  refreshToken,
  getCurrentUser,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  registerPublic,
} from "../controllers/userController.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/login", loginUser);
router.post("/signup", registerPublic);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", protectRoute, getCurrentUser);
router.get("/", protectRoute, requireRole("Owner", "Manager"), getAllUsers);
router.post("/register", protectRoute, requireRole("Owner", "Manager"), createUser);
router
  .route("/:id")
  .get(protectRoute, getUserById)
  .put(protectRoute, requireRole("Owner", "Manager"), updateUser)
  .delete(protectRoute, requireRole("Owner"), deleteUser);

export default router;
