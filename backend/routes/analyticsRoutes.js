import express from "express";
import {
  getMRR,
  getARR,
  getChurnRate,
  getCLV,
  getRevenueTrends,
  getCohortAnalysis,
  getCompanyPerformance,
  getAtRiskCompanies,
  getGeographicDistribution,
  getComprehensiveAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/mrr", getMRR);
router.get("/arr", getARR);
router.get("/churn-rate", getChurnRate);
router.get("/clv", getCLV);
router.get("/revenue-trends", getRevenueTrends);
router.get("/cohort-analysis", getCohortAnalysis);
router.get("/company-performance", getCompanyPerformance);
router.get("/at-risk", getAtRiskCompanies);
router.get("/geographic", getGeographicDistribution);
router.get("/comprehensive", getComprehensiveAnalytics);

// Bulk Export
router.post("/companies/bulk-export", async (req, res) => {
  try {
    const { companyIds, format = "csv" } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    
    // Fetch companies from Nexora
    const axios = (await import("axios")).default;
    const NEXORA_API_URL = process.env.NEXORA_API_URL || "http://localhost:5000/api";
    
    const companiesRes = await axios.get(`${NEXORA_API_URL}/companies`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    
    const allCompanies = companiesRes.data?.data || companiesRes.data || [];
    const selectedCompanies = allCompanies.filter((c) => companyIds.includes(c._id.toString()));
    
    if (format === "csv") {
      // Generate CSV
      const headers = ["Name", "Email", "Plan", "Status", "MRR", "Total Revenue", "Months Active"];
      const rows = selectedCompanies.map((c) => {
        const plan = c.subscription?.plan || "Free";
        const mrr = { Basic: 199, Pro: 399, Enterprise: 599, Free: 0 }[plan] || 0;
        const createdAt = new Date(c.createdAt);
        const monthsActive = Math.max(1, Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24 * 30)));
        const totalRevenue = mrr * monthsActive;
        
        return [
          c.name || "",
          c.email || "",
          plan,
          c.status || "",
          mrr,
          Math.round(totalRevenue),
          monthsActive,
        ];
      });
      
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=companies_export_${Date.now()}.csv`);
      res.send(csvContent);
    } else {
      // Return JSON for PDF generation (can be handled by frontend)
      res.json({
        success: true,
        data: selectedCompanies,
        format: "json",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

