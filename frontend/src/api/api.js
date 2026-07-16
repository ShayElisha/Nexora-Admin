import axios from "axios";

// כתובת השרת שלך. בפרודקשן (Vercel) זה same-origin => "/api".
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
// Nexora backend base (companies live here). בפרודקשן זו כתובת הדיפלוי של Nexora.
const NEXORA_API_URL =
  import.meta.env.VITE_NEXORA_API_URL || "http://localhost:5000/api";

// Create axios instance with credentials
const axiosInstance = axios.create({
  withCredentials: true,
  baseURL: API_URL,
});

// פונקציית התחברות
export const loginUser = async (email, password) => {
  try {
    const res = await axiosInstance.post("/users/login", { email, password });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// פונקציית התנתקות
export const logoutUser = async () => {
  try {
    await axiosInstance.post("/users/logout");
  } catch (err) {
    console.error("Logout error:", err);
  }
};

// רענון טוקן
export const refreshToken = async () => {
  try {
    const res = await axiosInstance.post("/users/refresh");
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// פונקציית רישום (ציבורי — משתמש ראשון בלבד)
export const registerUser = async (userData) => {
  try {
    const res = await axiosInstance.post("/users/signup", userData);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ============ Password Reset API Functions ============

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const res = await axios.post(`${API_URL}/users/forgot-password`, { email });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  try {
    const res = await axios.post(`${API_URL}/users/reset-password`, {
      token,
      password: newPassword,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// פונקציית קבלת מידע משתמש (עם cookies)
export const getMe = async () => {
  try {
    const res = await axiosInstance.get("/users/me");
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// קבלת כל החברות מבסיס הנתונים (משרת Nexora)
export const fetchAllCompanies = async (token) => {
  try {
    // Prefer the Nexora route that returns a standardized shape
    const res = await axios.get(`${NEXORA_API_URL}/companies`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: false,
    });
    // Some routes return {success, data}, others return array directly
    const data = res.data?.data ?? res.data;
    if (!Array.isArray(data)) {
      // Fallback to alternative companies route
      const alt = await axios.get(`${NEXORA_API_URL}/company/get-companies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return alt.data?.data ?? alt.data;
    }
    return data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchCompanyStatistics = async (token) => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/companies/statistics`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchCompanyById = async (companyId, token) => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/companies/${companyId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchAdminUsers = async () => {
  try {
    const res = await axiosInstance.get("/users");
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const createAdminUser = async (payload) => {
  try {
    const res = await axiosInstance.post("/users/register", payload);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const updateAdminUser = async (id, payload) => {
  try {
    const res = await axiosInstance.put(`/users/${id}`, payload);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const deleteAdminUser = async (id) => {
  try {
    const res = await axiosInstance.delete(`/users/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const updateCompanyPlanFromAdmin = async ({
  companyId,
  planName,
  duration,
}) => {
  try {
    const res = await axios.put(
      `${NEXORA_API_URL}/payment/update-subscription-admin`,
      {
        companyId,
        plan_name: planName,
        duration,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// קבלת חברות בהמתנה לאישור (משרת Nexora)
export const fetchPendingCompanies = async (token) => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/companies/pending`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: false,
    });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// אישור חברה
export const approveCompany = async (companyId, token) => {
  try {
    const res = await axios.put(
      `${NEXORA_API_URL}/companies/approve`,
      { id: companyId },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// דחיית חברה
export const rejectCompany = async (companyId, token) => {
  try {
    const res = await axios.put(
      `${NEXORA_API_URL}/companies/reject`,
      { id: companyId },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// עדכון סטטוס חברה
export const updateCompanyStatus = async (companyId, status, token) => {
  try {
    const res = await axios.put(
      `${NEXORA_API_URL}/companies/status`,
      { id: companyId, status },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ============ Bulk Actions API Functions ============

export const bulkUpdateStatus = async (companyIds, status, token) => {
  try {
    const res = await axios.post(
      `${NEXORA_API_URL}/companies/bulk-status`,
      { companyIds, status },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const bulkUpdatePlan = async (companyIds, plan, token) => {
  try {
    const res = await axios.post(
      `${NEXORA_API_URL}/companies/bulk-plan`,
      { companyIds, plan, duration: "Monthly" },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const exportSelectedCompanies = async (companyIds, format, token) => {
  try {
    const res = await axios.post(
      `${API_URL}/companies/bulk-export`,
      { companyIds, format },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        responseType: format === "csv" ? "blob" : "json",
      }
    );
    
    if (format === "csv") {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `companies_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ============ Analytics API Functions ============

export const getMRR = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/mrr`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getARR = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/arr`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getChurnRate = async (token, period = "month") => {
  try {
    const res = await axios.get(`${API_URL}/analytics/churn-rate`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      params: { period },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getCLV = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/clv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getRevenueTrends = async (token, months = 12) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/revenue-trends`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      params: { months },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getCohortAnalysis = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/cohort-analysis`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getCompanyPerformance = async (token, sortBy = "totalRevenue", plan = "all", industry = "all") => {
  try {
    const res = await axios.get(`${API_URL}/analytics/company-performance`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      params: { sortBy, limit: 50, ...(plan !== "all" && { plan }), ...(industry !== "all" && { industry }) },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getAtRiskCompanies = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/at-risk`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getGeographicDistribution = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/geographic`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getComprehensiveAnalytics = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/analytics/comprehensive`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ============ Support Tickets API Functions ============

export const fetchSupportTickets = async (token) => {
  try {
    // Prefer SuperAdmin-dedicated route (no Nexora employee cookie needed)
    const res = await axios.get(`${NEXORA_API_URL}/support-tickets/superadmin/all`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: false,
    });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // Soft-fail: empty list instead of crashing the page when unauthorized / offline
    const status = err.response?.status;
    if (status === 401 || status === 403 || status === 404) {
      return [];
    }
    throw err.response?.data || err.message;
  }
};

export const fetchSupportTicketById = async (ticketId, token) => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/support-tickets/${ticketId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: true,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const updateSupportTicketStatus = async (ticketId, status, token) => {
  try {
    const res = await axios.put(
      `${NEXORA_API_URL}/support-tickets/${ticketId}`,
      { status },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const addSupportTicketComment = async (ticketId, comment, token) => {
  try {
    const res = await axios.post(
      `${NEXORA_API_URL}/support-tickets/${ticketId}/comments`,
      { comment },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ============ Alerts API Functions ============

export const fetchAlerts = async (params = {}) => {
  try {
    const res = await axios.get(`${API_URL}/alerts`, { params });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchAlertStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/alerts/stats`);
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const markAlertAsRead = async (alertId) => {
  try {
    const res = await axios.put(`${API_URL}/alerts/${alertId}/read`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const markAlertAsResolved = async (alertId) => {
  try {
    const res = await axios.put(`${API_URL}/alerts/${alertId}/resolve`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const markAllAlertsAsRead = async () => {
  try {
    const res = await axios.put(`${API_URL}/alerts/read-all`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const deleteAlert = async (alertId) => {
  try {
    const res = await axios.delete(`${API_URL}/alerts/${alertId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const runAlertChecks = async () => {
  try {
    const res = await axios.post(`${API_URL}/alerts/check`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ============ Invoices API Functions ============

// Note: Invoices are stored in Nexora backend, so we call Nexora API
export const fetchAllInvoices = async (params = {}) => {
  try {
    // For SuperAdmin, we use the special endpoint that returns all invoices from all companies
    const res = await axios.get(`${NEXORA_API_URL}/invoices/superadmin/all`, {
      params,
      withCredentials: true,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchInvoiceById = async (invoiceId) => {
  try {
    // Use SuperAdmin endpoint to get invoice without company restriction
    const res = await axios.get(`${NEXORA_API_URL}/invoices/superadmin/${invoiceId}`, {
      withCredentials: true,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchInvoiceStats = async () => {
  try {
    // For SuperAdmin, we use the special endpoint that returns stats for all companies
    const res = await axios.get(`${NEXORA_API_URL}/invoices/superadmin/stats`, {
      withCredentials: true,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const downloadInvoicePDF = (invoiceId) => {
  // Use SuperAdmin PDF endpoint to access any invoice without company restriction
  return `${NEXORA_API_URL}/invoices/superadmin/${invoiceId}/pdf`;
};

// ============ Payments API Functions ============

// Fetch all payments (for SuperAdmin)
export const fetchAllPayments = async (params = {}) => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/payment/superadmin/all`, {
      params,
      withCredentials: true,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// Fetch payment by ID
export const fetchPaymentById = async (paymentId) => {
  try {
    const res = await axios.get(`${NEXORA_API_URL}/payment/${paymentId}`, {
      withCredentials: true,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ============ Communication Center API Functions ============

// Messages
export const sendMessage = async (messageData) => {
  try {
    const res = await axiosInstance.post("/communication/messages", messageData);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchMessages = async (params = {}) => {
  try {
    const res = await axiosInstance.get("/communication/messages", { params });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchMessageById = async (messageId) => {
  try {
    const res = await axiosInstance.get(`/communication/messages/${messageId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const res = await axiosInstance.delete(`/communication/messages/${messageId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// Templates
export const createTemplate = async (templateData) => {
  try {
    const res = await axiosInstance.post("/communication/templates", templateData);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchTemplates = async (params = {}) => {
  try {
    const res = await axiosInstance.get("/communication/templates", { params });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const fetchTemplateById = async (templateId) => {
  try {
    const res = await axiosInstance.get(`/communication/templates/${templateId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const updateTemplate = async (templateId, templateData) => {
  try {
    const res = await axiosInstance.put(`/communication/templates/${templateId}`, templateData);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    const res = await axiosInstance.delete(`/communication/templates/${templateId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};
