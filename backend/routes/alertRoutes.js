import express from "express";
import {
  getAlerts,
  getAlertStats,
  getAlertById,
  markAsRead,
  markAsResolved,
  markAllAsRead,
  deleteAlert,
  runAllChecks,
} from "../controllers/alertController.js";

const router = express.Router();

// Get all alerts with filters
router.get("/", getAlerts);

// Get alert statistics
router.get("/stats", getAlertStats);

// Get single alert
router.get("/:id", getAlertById);

// Mark alert as read
router.put("/:id/read", markAsRead);

// Mark alert as resolved
router.put("/:id/resolve", markAsResolved);

// Mark all alerts as read
router.put("/read-all", markAllAsRead);

// Delete alert
router.delete("/:id", deleteAlert);

// Run all automatic checks (manual trigger)
router.post("/check", runAllChecks);

export default router;

