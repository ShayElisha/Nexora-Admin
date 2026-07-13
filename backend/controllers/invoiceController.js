import axios from "axios";

const NEXORA_API_URL = process.env.NEXORA_API_URL || "http://localhost:5000/api";

/**
 * Get all invoices from all companies
 * This requires calling Nexora API for each company
 * For now, we'll create a proxy endpoint that calls Nexora
 */
export const getAllInvoices = async (req, res) => {
  try {
    // For SuperAdmin, we need to aggregate invoices from all companies
    // This is a simplified version - in production, you might want to:
    // 1. Store invoices in a centralized database
    // 2. Use a service that aggregates data from multiple sources
    // 3. Implement proper authentication between services

    // For now, we'll return an empty array or implement a basic proxy
    // The frontend will need to handle calling Nexora API directly
    // with proper authentication

    return res.status(200).json({
      success: true,
      data: [],
      message: "Invoices endpoint - call Nexora API directly from frontend",
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: error.message,
    });
  }
};

/**
 * Get invoice statistics
 */
export const getInvoiceStats = async (req, res) => {
  try {
    // Similar to getAllInvoices, this would aggregate stats from all companies
    return res.status(200).json({
      success: true,
      data: {
        total: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoice statistics",
      error: error.message,
    });
  }
};

