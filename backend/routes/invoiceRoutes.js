import express from "express";
import { getAllInvoices, getInvoiceStats } from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/", getAllInvoices);
router.get("/stats", getInvoiceStats);

export default router;

