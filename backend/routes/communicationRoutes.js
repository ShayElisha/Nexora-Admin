import express from "express";
import {
  sendMessage,
  getMessages,
  getMessageById,
  deleteMessage,
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "../controllers/communicationController.js";
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Messages routes
router.post("/messages", requireRole("Owner", "Manager", "Support"), sendMessage);
router.get("/messages", getMessages);
router.get("/messages/:id", getMessageById);
router.delete("/messages/:id", requireRole("Owner", "Manager"), deleteMessage);

// Templates routes
router.post("/templates", requireRole("Owner", "Manager"), createTemplate);
router.get("/templates", getTemplates);
router.get("/templates/:id", getTemplateById);
router.put("/templates/:id", requireRole("Owner", "Manager"), updateTemplate);
router.delete("/templates/:id", requireRole("Owner", "Manager"), deleteTemplate);

export default router;

