import axios from "axios";

const NEXORA_API_URL = process.env.NEXORA_API_URL || "http://localhost:5000/api";

// Helper function to fetch companies from Nexora API
const fetchCompaniesFromNexora = async (token) => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/companies`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: false,
    });
    const data = res.data?.data ?? res.data;
    if (!Array.isArray(data)) {
      const alt = await axios.get(`${NEXORA_API_URL}/company/get-companies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return alt.data?.data ?? alt.data ?? [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching companies:", error.message);
    return [];
  }
};

// Plan prices mapping
const PLAN_PRICES = {
  Basic: 199,
  Pro: 399,
  Enterprise: 599,
  Free: 0,
};

// Calculate MRR (Monthly Recurring Revenue)
export const getMRR = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const companies = await fetchCompaniesFromNexora(token);

    const mrr = companies.reduce((total, company) => {
      if (company.status === "Active" && company.subscription?.plan) {
        const plan = company.subscription.plan;
        return total + (PLAN_PRICES[plan] || 0);
      }
      return total;
    }, 0);

    res.json({
      success: true,
      data: {
        mrr: Math.round(mrr),
        currency: "USD",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Calculate ARR (Annual Recurring Revenue)
export const getARR = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const companies = await fetchCompaniesFromNexora(token);

    const mrr = companies.reduce((total, company) => {
      if (company.status === "Active" && company.subscription?.plan) {
        const plan = company.subscription.plan;
        return total + (PLAN_PRICES[plan] || 0);
      }
      return total;
    }, 0);

    const arr = mrr * 12;

    res.json({
      success: true,
      data: {
        arr: Math.round(arr),
        mrr: Math.round(mrr),
        currency: "USD",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Calculate Churn Rate
export const getChurnRate = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const { period = "month" } = req.query;
    const companies = await fetchCompaniesFromNexora(token);

    const now = new Date();
    const periodStart = new Date(now);
    
    if (period === "month") {
      periodStart.setMonth(periodStart.getMonth() - 1);
    } else if (period === "quarter") {
      periodStart.setMonth(periodStart.getMonth() - 3);
    } else if (period === "year") {
      periodStart.setFullYear(periodStart.getFullYear() - 1);
    }

    // Companies that were active at start of period
    const activeAtStart = companies.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt <= periodStart && c.status === "Active";
    }).length;

    // Companies that churned (became inactive) during period
    const churned = companies.filter((c) => {
      const updatedAt = new Date(c.updatedAt || c.createdAt);
      return (
        updatedAt >= periodStart &&
        updatedAt <= now &&
        c.status === "Inactive"
      );
    }).length;

    const churnRate = activeAtStart > 0 ? (churned / activeAtStart) * 100 : 0;

    res.json({
      success: true,
      data: {
        churnRate: Math.round(churnRate * 100) / 100,
        churned,
        activeAtStart,
        period,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Calculate Customer Lifetime Value (CLV)
export const getCLV = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const companies = await fetchCompaniesFromNexora(token);

    const activeCompanies = companies.filter((c) => c.status === "Active");
    
    if (activeCompanies.length === 0) {
      return res.json({
        success: true,
        data: {
          averageCLV: 0,
          totalCLV: 0,
        },
      });
    }

    const totalRevenue = activeCompanies.reduce((sum, company) => {
      const plan = company.subscription?.plan || "Free";
      return sum + (PLAN_PRICES[plan] || 0);
    }, 0);

    const averageMonthlyRevenue = totalRevenue / activeCompanies.length;
    const averageLifetimeMonths = 24; // Assuming average 2-year lifetime
    const averageCLV = averageMonthlyRevenue * averageLifetimeMonths;

    res.json({
      success: true,
      data: {
        averageCLV: Math.round(averageCLV),
        totalCLV: Math.round(averageCLV * activeCompanies.length),
        averageLifetimeMonths,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get Revenue Trends
export const getRevenueTrends = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const { months = 12 } = req.query;
    const companies = await fetchCompaniesFromNexora(token);

    const trends = [];
    const now = new Date();

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = companies.reduce((sum, company) => {
        const createdAt = new Date(company.createdAt);
        if (
          createdAt <= monthEnd &&
          company.status === "Active" &&
          company.subscription?.plan
        ) {
          const plan = company.subscription.plan;
          return sum + (PLAN_PRICES[plan] || 0);
        }
        return sum;
      }, 0);

      trends.push({
        month: date.toLocaleString("default", { month: "short", year: "numeric" }),
        revenue: Math.round(monthRevenue),
        newCompanies: companies.filter((c) => {
          const created = new Date(c.createdAt);
          return (
            created >= date &&
            created <= monthEnd
          );
        }).length,
      });
    }

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get Cohort Analysis
export const getCohortAnalysis = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const companies = await fetchCompaniesFromNexora(token);

    const cohorts = {};
    const now = new Date();

    companies.forEach((company) => {
      const createdAt = new Date(company.createdAt);
      const cohortKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;

      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          cohort: cohortKey,
          total: 0,
          active: 0,
          inactive: 0,
          revenue: 0,
        };
      }

      cohorts[cohortKey].total++;
      if (company.status === "Active") {
        cohorts[cohortKey].active++;
        const plan = company.subscription?.plan || "Free";
        cohorts[cohortKey].revenue += PLAN_PRICES[plan] || 0;
      } else {
        cohorts[cohortKey].inactive++;
      }
    });

    const cohortData = Object.values(cohorts)
      .sort((a, b) => a.cohort.localeCompare(b.cohort))
      .slice(-12); // Last 12 months

    res.json({
      success: true,
      data: cohortData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get Company Performance
export const getCompanyPerformance = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const { sortBy = "totalRevenue", limit = 50, plan, industry } = req.query;
    const companies = await fetchCompaniesFromNexora(token);

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    let performance = companies
      .filter((c) => {
        if (c.status !== "Active") return false;
        if (plan && c.subscription?.plan !== plan) return false;
        if (industry && c.industry !== industry) return false;
        return true;
      })
      .map((company) => {
        const planType = company.subscription?.plan || "Free";
        const mrr = PLAN_PRICES[planType] || 0;
        const createdAt = new Date(company.createdAt);
        const updatedAt = new Date(company.updatedAt || company.createdAt);
        const monthsActive = Math.max(
          1,
          Math.floor((now - createdAt) / (1000 * 60 * 60 * 24 * 30))
        );
        const totalRevenue = mrr * monthsActive;
        
        // Calculate growth rate (comparing last month to previous month)
        const wasActiveLastMonth = createdAt <= oneMonthAgo;
        const wasActiveThreeMonthsAgo = createdAt <= threeMonthsAgo;
        let growthRate = 0;
        if (wasActiveThreeMonthsAgo && wasActiveLastMonth) {
          // Simple growth calculation based on activity
          growthRate = 5; // Default growth for established companies
        } else if (wasActiveLastMonth && !wasActiveThreeMonthsAgo) {
          growthRate = 15; // New company in last month
        }

        // Calculate performance score (0-100)
        let performanceScore = 50; // Base score
        if (planType === "Enterprise") performanceScore += 20;
        else if (planType === "Pro") performanceScore += 10;
        if (monthsActive > 12) performanceScore += 15;
        if (monthsActive > 6) performanceScore += 10;
        if (mrr > 300) performanceScore += 5;
        performanceScore = Math.min(100, performanceScore);

        // Determine health status
        let healthStatus = "healthy";
        const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 90) healthStatus = "at-risk";
        if (company.subscription?.paymentStatus === "Failed") healthStatus = "critical";
        if (performanceScore < 40) healthStatus = "at-risk";

        // Determine revenue trend
        let revenueTrend = "stable";
        if (growthRate > 10) revenueTrend = "growing";
        else if (growthRate < -5) revenueTrend = "declining";

        // Calculate activity score (based on last update)
        let activityScore = 100;
        if (daysSinceUpdate > 30) activityScore = 70;
        if (daysSinceUpdate > 60) activityScore = 50;
        if (daysSinceUpdate > 90) activityScore = 30;

        return {
          id: company._id,
          name: company.name,
          email: company.email,
          plan: planType,
          industry: company.industry || "Unknown",
          country: company.address?.country || "Unknown",
          mrr,
          monthsActive,
          totalRevenue: Math.round(totalRevenue),
          growthRate: Math.round(growthRate * 100) / 100,
          performanceScore: Math.round(performanceScore),
          healthStatus,
          revenueTrend,
          activityScore: Math.round(activityScore),
          status: company.status,
          paymentStatus: company.subscription?.paymentStatus || "Unknown",
          createdAt: company.createdAt,
          updatedAt: company.updatedAt || company.createdAt,
          lastActivityDays: daysSinceUpdate,
        };
      });

    // Sort by selected criteria
    const sortOptions = {
      totalRevenue: (a, b) => b.totalRevenue - a.totalRevenue,
      mrr: (a, b) => b.mrr - a.mrr,
      monthsActive: (a, b) => b.monthsActive - a.monthsActive,
      growthRate: (a, b) => b.growthRate - a.growthRate,
      performanceScore: (a, b) => b.performanceScore - a.performanceScore,
      name: (a, b) => a.name.localeCompare(b.name),
    };

    performance.sort(sortOptions[sortBy] || sortOptions.totalRevenue);

    // Apply limit
    const limitNum = parseInt(limit) || 50;
    performance = performance.slice(0, limitNum);

    res.json({
      success: true,
      data: performance,
      total: companies.filter((c) => c.status === "Active").length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get At-Risk Companies
export const getAtRiskCompanies = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const companies = await fetchCompaniesFromNexora(token);

    const now = new Date();
    const atRisk = companies
      .filter((company) => {
        if (company.status !== "Active") return false;
        
        // Check if payment is overdue
        if (company.subscription?.paymentStatus === "Failed") return true;
        
        // Check if subscription is ending soon (within 30 days)
        if (company.endDate) {
          const daysUntilEnd = Math.floor(
            (new Date(company.endDate) - now) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilEnd > 0 && daysUntilEnd <= 30) return true;
        }
        
        // Check if low activity (created more than 3 months ago but no recent updates)
        const updatedAt = new Date(company.updatedAt || company.createdAt);
        const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 90) return true;

        return false;
      })
      .map((company) => ({
        id: company._id,
        name: company.name,
        email: company.email,
        plan: company.subscription?.plan || "Free",
        paymentStatus: company.subscription?.paymentStatus || "Unknown",
        endDate: company.endDate,
        riskScore: company.subscription?.paymentStatus === "Failed" ? 90 : 60,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 20);

    res.json({
      success: true,
      data: atRisk,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get Geographic Distribution
export const getGeographicDistribution = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const companies = await fetchCompaniesFromNexora(token);

    const distribution = {};

    companies.forEach((company) => {
      const country = company.address?.country || "Unknown";
      if (!distribution[country]) {
        distribution[country] = {
          country,
          count: 0,
          active: 0,
          revenue: 0,
        };
      }
      distribution[country].count++;
      if (company.status === "Active") {
        distribution[country].active++;
        const plan = company.subscription?.plan || "Free";
        distribution[country].revenue += PLAN_PRICES[plan] || 0;
      }
    });

    const data = Object.values(distribution)
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        ...item,
        revenue: Math.round(item.revenue),
      }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get Comprehensive Analytics
export const getComprehensiveAnalytics = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : authHeader;
    const companies = await fetchCompaniesFromNexora(token);

    const activeCompanies = companies.filter((c) => c.status === "Active");
    const pendingCompanies = companies.filter((c) => c.status === "Pending");
    const inactiveCompanies = companies.filter((c) => c.status === "Inactive");

    // Calculate MRR
    const mrr = activeCompanies.reduce((sum, company) => {
      const plan = company.subscription?.plan || "Free";
      return sum + (PLAN_PRICES[plan] || 0);
    }, 0);

    // Calculate ARR
    const arr = mrr * 12;

    // Calculate ARPU
    const arpu = activeCompanies.length > 0 ? mrr / activeCompanies.length : 0;

    // Calculate Growth Rate
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthCompanies = companies.filter((c) => {
      const created = new Date(c.createdAt);
      return created < thisMonth && created >= lastMonth;
    }).length;
    
    const thisMonthCompanies = companies.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= thisMonth;
    }).length;

    const growthRate = lastMonthCompanies > 0
      ? ((thisMonthCompanies - lastMonthCompanies) / lastMonthCompanies) * 100
      : 0;

    // Calculate Conversion Rate (Pending to Active)
    const totalPending = pendingCompanies.length;
    const converted = companies.filter((c) => {
      const created = new Date(c.createdAt);
      const updated = new Date(c.updatedAt || c.createdAt);
      return c.status === "Active" && updated > created;
    }).length;
    
    const conversionRate = totalPending > 0
      ? (converted / (totalPending + converted)) * 100
      : 0;

    res.json({
      success: true,
      data: {
        mrr: Math.round(mrr),
        arr: Math.round(arr),
        arpu: Math.round(arpu * 100) / 100,
        growthRate: Math.round(growthRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalCompanies: companies.length,
        activeCompanies: activeCompanies.length,
        pendingCompanies: pendingCompanies.length,
        inactiveCompanies: inactiveCompanies.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

