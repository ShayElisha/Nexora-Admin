import Alert from "../models/alertModel.js";
import axios from "axios";

const NEXORA_API_URL = process.env.NEXORA_API_URL || "http://localhost:5000/api";

// Helper function to fetch companies from Nexora API
const fetchCompaniesFromNexora = async () => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/companies`, {
      withCredentials: false,
    });
    const data = res.data?.data ?? res.data;
    if (!Array.isArray(data)) {
      const alt = await axios.get(`${NEXORA_API_URL}/company/get-companies`);
      return alt.data?.data ?? alt.data ?? [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching companies:", error.message);
    return [];
  }
};

// Helper function to fetch support tickets from Nexora API
const fetchSupportTicketsFromNexora = async () => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/support-tickets`, {
      withCredentials: true,
    });
    return res.data?.data ?? res.data ?? [];
  } catch (error) {
    console.error("Error fetching support tickets:", error.message);
    return [];
  }
};

// Helper function to create alert (avoid duplicates)
const createAlertIfNotExists = async (alertData) => {
  try {
    // Check if similar alert already exists (same type, entity, and unread)
    const existing = await Alert.findOne({
      type: alertData.type,
      "relatedEntity.entityId": alertData.relatedEntity?.entityId,
      status: { $in: ["unread", "read"] },
    });

    if (existing) {
      return null; // Alert already exists
    }

    const alert = new Alert(alertData);
    await alert.save();
    return alert;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error;
  }
};

// ========================
// CRUD OPERATIONS
// ========================

/**
 * Get all alerts with filters
 */
export const getAlerts = async (req, res) => {
  try {
    const { status, type, priority, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }
    if (type && type !== "all") {
      query.type = type;
    }
    if (priority && priority !== "all") {
      query.priority = priority;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get alert statistics
 */
export const getAlertStats = async (req, res) => {
  try {
    const total = await Alert.countDocuments();
    const unread = await Alert.countDocuments({ status: "unread" });
    const read = await Alert.countDocuments({ status: "read" });
    const resolved = await Alert.countDocuments({ status: "resolved" });
    const critical = await Alert.countDocuments({
      priority: "critical",
      status: { $in: ["unread", "read"] },
    });

    const byType = await Alert.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ["$status", "unread"] }, 1, 0] },
          },
        },
      },
    ]);

    const byPriority = await Alert.aggregate([
      {
        $match: { status: { $in: ["unread", "read"] } },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        total,
        unread,
        read,
        resolved,
        critical,
        byType,
        byPriority,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get single alert by ID
 */
export const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }
    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark alert as read
 */
export const markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: "read",
        readAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark alert as resolved
 */
export const markAsResolved = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark all alerts as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Alert.updateMany(
      { status: "unread" },
      {
        status: "read",
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} alerts marked as read`,
      count: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete alert
 */
export const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ========================
// AUTOMATIC CHECKS
// ========================

/**
 * Check for pending companies
 */
export const checkPendingCompanies = async () => {
  try {
    console.log("🔍 Checking for pending companies...");
    const companies = await fetchCompaniesFromNexora();
    const pendingCompanies = companies.filter(
      (company) => company.status === "Pending"
    );

    let alertsCreated = 0;
    for (const company of pendingCompanies) {
      await createAlertIfNotExists({
        title: "חברה חדשה ממתינה לאישור",
        message: `החברה "${company.name}" ממתינה לאישור`,
        type: "company_pending",
        priority: "high",
        relatedEntity: {
          entityType: "Company",
          entityId: company._id?.toString() || company.id,
        },
        actionUrl: `/pending-companies`,
        actionLabel: "צפה בחברה",
        metadata: {
          companyName: company.name,
          companyEmail: company.email,
        },
      });
      alertsCreated++;
    }

    console.log(`✅ Created ${alertsCreated} pending company alerts`);
    return alertsCreated;
  } catch (error) {
    console.error("❌ Error in checkPendingCompanies:", error);
    return 0;
  }
};

/**
 * Check for payment issues
 */
export const checkPaymentIssues = async () => {
  try {
    console.log("🔍 Checking for payment issues...");
    const companies = await fetchCompaniesFromNexora();
    let alertsCreated = 0;

    for (const company of companies) {
      const paymentStatus = company.subscription?.paymentStatus;
      const isActive = company.status === "Active";

      if (isActive && paymentStatus === "Failed") {
        await createAlertIfNotExists({
          title: "בעיית תשלום",
          message: `תשלום נכשל עבור החברה "${company.name}"`,
          type: "payment_failed",
          priority: "critical",
          relatedEntity: {
            entityType: "Company",
            entityId: company._id?.toString() || company.id,
          },
          actionUrl: `/companies/${company._id || company.id}`,
          actionLabel: "צפה בחברה",
          metadata: {
            companyName: company.name,
            paymentStatus,
          },
        });
        alertsCreated++;
      } else if (isActive && paymentStatus === "Pending") {
        await createAlertIfNotExists({
          title: "תשלום ממתין",
          message: `תשלום ממתין עבור החברה "${company.name}"`,
          type: "payment_issue",
          priority: "high",
          relatedEntity: {
            entityType: "Company",
            entityId: company._id?.toString() || company.id,
          },
          actionUrl: `/companies/${company._id || company.id}`,
          actionLabel: "צפה בחברה",
          metadata: {
            companyName: company.name,
            paymentStatus,
          },
        });
        alertsCreated++;
      }
    }

    console.log(`✅ Created ${alertsCreated} payment issue alerts`);
    return alertsCreated;
  } catch (error) {
    console.error("❌ Error in checkPaymentIssues:", error);
    return 0;
  }
};

/**
 * Check for expiring subscriptions
 */
export const checkExpiringSubscriptions = async () => {
  try {
    console.log("🔍 Checking for expiring subscriptions...");
    const companies = await fetchCompaniesFromNexora();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    let alertsCreated = 0;
    for (const company of companies) {
      if (!company.endDate || company.status !== "Active") continue;

      const endDate = new Date(company.endDate);
      const daysUntilExpiry = Math.ceil(
        (endDate - now) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) {
        // Already expired
        await createAlertIfNotExists({
          title: "מנוי פג תוקף",
          message: `המנוי של החברה "${company.name}" פג תוקף`,
          type: "subscription_expired",
          priority: "critical",
          relatedEntity: {
            entityType: "Company",
            entityId: company._id?.toString() || company.id,
          },
          actionUrl: `/companies/${company._id || company.id}`,
          actionLabel: "צפה בחברה",
          metadata: {
            companyName: company.name,
            endDate: company.endDate,
          },
        });
        alertsCreated++;
      } else if (daysUntilExpiry <= 3) {
        // Expiring in 3 days
        await createAlertIfNotExists({
          title: "מנוי פג תוקף בעוד 3 ימים",
          message: `המנוי של החברה "${company.name}" פג תוקף בעוד ${daysUntilExpiry} ימים`,
          type: "subscription_expiring",
          priority: "critical",
          relatedEntity: {
            entityType: "Company",
            entityId: company._id?.toString() || company.id,
          },
          actionUrl: `/companies/${company._id || company.id}`,
          actionLabel: "צפה בחברה",
          metadata: {
            companyName: company.name,
            endDate: company.endDate,
            daysUntilExpiry,
          },
        });
        alertsCreated++;
      } else if (daysUntilExpiry <= 7) {
        // Expiring in 7 days
        await createAlertIfNotExists({
          title: "מנוי פג תוקף בעוד 7 ימים",
          message: `המנוי של החברה "${company.name}" פג תוקף בעוד ${daysUntilExpiry} ימים`,
          type: "subscription_expiring",
          priority: "high",
          relatedEntity: {
            entityType: "Company",
            entityId: company._id?.toString() || company.id,
          },
          actionUrl: `/companies/${company._id || company.id}`,
          actionLabel: "צפה בחברה",
          metadata: {
            companyName: company.name,
            endDate: company.endDate,
            daysUntilExpiry,
          },
        });
        alertsCreated++;
      }
    }

    console.log(`✅ Created ${alertsCreated} expiring subscription alerts`);
    return alertsCreated;
  } catch (error) {
    console.error("❌ Error in checkExpiringSubscriptions:", error);
    return 0;
  }
};

/**
 * Check for at-risk companies (using analytics endpoint)
 */
export const checkAtRiskCompanies = async () => {
  try {
    console.log("🔍 Checking for at-risk companies...");
    // This would use the analytics endpoint, but for now we'll use a simple check
    const companies = await fetchCompaniesFromNexora();
    let alertsCreated = 0;

    // Simple heuristic: companies with failed payments or expired subscriptions
    for (const company of companies) {
      const paymentStatus = company.subscription?.paymentStatus;
      const endDate = company.endDate ? new Date(company.endDate) : null;
      const now = new Date();

      if (
        (paymentStatus === "Failed" && company.status === "Active") ||
        (endDate && endDate < now && company.status === "Active")
      ) {
        await createAlertIfNotExists({
          title: "חברה בסיכון",
          message: `החברה "${company.name}" נמצאת בסיכון`,
          type: "at_risk_company",
          priority: "high",
          relatedEntity: {
            entityType: "Company",
            entityId: company._id?.toString() || company.id,
          },
          actionUrl: `/companies/${company._id || company.id}`,
          actionLabel: "צפה בחברה",
          metadata: {
            companyName: company.name,
            reason: paymentStatus === "Failed" ? "payment_failed" : "subscription_expired",
          },
        });
        alertsCreated++;
      }
    }

    console.log(`✅ Created ${alertsCreated} at-risk company alerts`);
    return alertsCreated;
  } catch (error) {
    console.error("❌ Error in checkAtRiskCompanies:", error);
    return 0;
  }
};

/**
 * Check for high priority support tickets
 */
export const checkHighPriorityTickets = async () => {
  try {
    console.log("🔍 Checking for high priority support tickets...");
    const tickets = await fetchSupportTicketsFromNexora();
    const highPriorityTickets = tickets.filter(
      (ticket) =>
        (ticket.priority === "Urgent" || ticket.priority === "High") &&
        ticket.status !== "Resolved" &&
        ticket.status !== "Closed"
    );

    let alertsCreated = 0;
    for (const ticket of highPriorityTickets) {
      await createAlertIfNotExists({
        title: "כרטיס תמיכה דחוף",
        message: `כרטיס תמיכה דחוף: "${ticket.title}"`,
        type: "high_priority_ticket",
        priority: ticket.priority === "Urgent" ? "critical" : "high",
        relatedEntity: {
          entityType: "SupportTicket",
          entityId: ticket._id?.toString() || ticket.id,
        },
        actionUrl: `/support-tickets/${ticket._id || ticket.id}`,
        actionLabel: "צפה בכרטיס",
        metadata: {
          ticketTitle: ticket.title,
          priority: ticket.priority,
          status: ticket.status,
        },
      });
      alertsCreated++;
    }

    console.log(`✅ Created ${alertsCreated} high priority ticket alerts`);
    return alertsCreated;
  } catch (error) {
    console.error("❌ Error in checkHighPriorityTickets:", error);
    return 0;
  }
};

/**
 * Run all checks
 */
export const runAllChecks = async (req, res) => {
  try {
    const results = {
      pendingCompanies: await checkPendingCompanies(),
      paymentIssues: await checkPaymentIssues(),
      expiringSubscriptions: await checkExpiringSubscriptions(),
      atRiskCompanies: await checkAtRiskCompanies(),
      highPriorityTickets: await checkHighPriorityTickets(),
    };

    const total = Object.values(results).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      message: `Created ${total} alerts`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

