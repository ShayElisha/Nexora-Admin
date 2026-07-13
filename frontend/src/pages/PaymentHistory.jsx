import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/Toaster.jsx";
import { fetchAllCompanies } from "../api/api";

export default function PaymentHistory() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Load payments function (extracted for reuse)
  const loadPayments = async () => {
      try {
      setLoading(true);
      // Load companies first to get company names
        const token = JSON.parse(localStorage.getItem("user"))?.token;
      const companiesData = await fetchAllCompanies(token);
      const companiesList = Array.isArray(companiesData) ? companiesData : [];
      setCompanies(companiesList);
      
      // Create companies map for quick lookup
      const companiesMap = {};
      companiesList.forEach(company => {
        companiesMap[company._id] = company;
      });

      // Load all payments directly from Payment model
      const { fetchAllPayments } = await import("../api/api");
      
      // Load all payments (without pagination limit to get all)
      const paymentsResponse = await fetchAllPayments({ page: 1, limit: 1000 });
      
      console.log("🔍 Payments response:", paymentsResponse);
      
      // Handle different response formats
      let paymentsData = [];
      if (Array.isArray(paymentsResponse)) {
        paymentsData = paymentsResponse;
      } else if (paymentsResponse?.data && Array.isArray(paymentsResponse.data)) {
        paymentsData = paymentsResponse.data;
      } else if (paymentsResponse?.pagination?.data) {
        paymentsData = paymentsResponse.pagination.data;
      }
      
      console.log(`📋 Total payments loaded: ${paymentsData.length}`);
      
      // Convert payments to display format
      const allPaymentRecords = paymentsData.map(payment => {
        // Handle both populated and unpopulated companyId
        const companyId = typeof payment.companyId === 'object' 
          ? payment.companyId?._id || payment.companyId 
          : payment.companyId;
        const company = companiesMap[companyId] || payment.companyId || {};
        const companyName = typeof company === 'object' 
          ? (company.name || "Unknown Company") 
          : "Unknown Company";
        
        // Map payment status to display format
        let displayStatus = "Paid";
        if (payment.paymentStatus === "succeeded") {
          displayStatus = "Paid";
        } else if (payment.paymentStatus === "pending") {
          displayStatus = "Pending";
        } else if (payment.paymentStatus === "failed") {
          displayStatus = "Failed";
        }
        
        return {
          id: payment._id,
          _id: payment._id,
          companyId: companyId,
          companyName: companyName,
          amount: payment.amount || 0,
          currency: payment.currency?.toUpperCase() || "USD",
          planName: payment.planName || "Unknown",
          paymentDate: payment.paymentDate || payment.createdAt || new Date(),
          paymentStatus: displayStatus,
          invoiceId: payment.invoiceId || null, // Stripe invoice ID
          subscriptionId: payment.subscriptionId || null,
          paymentIntentId: payment.paymentIntentId || null,
          isRecurring: payment.isRecurring || false,
          periodNumber: payment.periodNumber || 1,
        };
      });
      
      console.log(`✅ Payment records created: ${allPaymentRecords.length}`);
      
      setPayments(allPaymentRecords);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error loading payments:", err);
      console.error("❌ Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      showToast(err?.response?.data?.message || err?.message || "Failed to load payments", "error");
      setPayments([]); // Set empty array on error
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);


  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.planName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || payment.paymentStatus === filterStatus;
      const matchesDate =
        !dateRange.start ||
        !dateRange.end ||
        (new Date(payment.paymentDate) >= new Date(dateRange.start) &&
          new Date(payment.paymentDate) <= new Date(dateRange.end));
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [payments, searchTerm, filterStatus, dateRange]);

  const statistics = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const successful = filteredPayments.filter(
      (p) => p.paymentStatus === "Paid" || p.paymentStatus === "succeeded"
    ).length;
    const failed = filteredPayments.filter(
      (p) => p.paymentStatus === "Failed" || p.paymentStatus === "failed"
    ).length;
    const pending = filteredPayments.filter(
      (p) => p.paymentStatus === "Pending" || p.paymentStatus === "pending"
    ).length;
    return { total, successful, failed, pending };
  }, [filteredPayments]);

  const handleExport = () => {
    // TODO: Implement export to CSV/Excel
    showToast("Export functionality coming soon", "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("payments.title")}</h1>
          <p className="text-[var(--text-secondary)]">
            {t("payments.subtitle")}
          </p>
        </header>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm text-[var(--text-muted)] mb-2">
              {t("payments.totalRevenue")}
            </div>
            <div className="text-2xl font-bold">
              ${statistics.total.toLocaleString()}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-[var(--text-muted)] mb-2">
              {t("payments.successful")}
            </div>
            <div className="text-2xl font-bold text-[var(--success)]">
              {statistics.successful}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-[var(--text-muted)] mb-2">
              {t("payments.failed")}
            </div>
            <div className="text-2xl font-bold text-[var(--error)]">
              {statistics.failed}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-[var(--text-muted)] mb-2">
              {t("payments.pending")}
            </div>
            <div className="text-2xl font-bold text-[var(--warning)]">
              {statistics.pending}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-2">
                {t("payments.search")}
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder={t("payments.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-2">
                {t("payments.status")}
              </label>
              <select
                className="input w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">{t("payments.allStatuses")}</option>
                <option value="Paid">{t("payments.paid")}</option>
                <option value="Pending">{t("payments.pending")}</option>
                <option value="Failed">{t("payments.failed")}</option>
                <option value="Canceled">{t("payments.canceled")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">
                {t("payments.startDate")}
              </label>
              <input
                type="date"
                className="input w-full"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-2">
                {t("payments.endDate")}
              </label>
              <input
                type="date"
                className="input w-full"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-secondary" onClick={handleExport}>
              {t("payments.export")}
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    {t("payments.date")}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    {t("payments.company")}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    {t("payments.plan")}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    {t("payments.amount")}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    {t("payments.status")}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    {t("payments.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="spinner" />
                        <span>Loading payments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center gap-2">
                        <p>{t("payments.noPayments")}</p>
                        {payments.length === 0 && !loading && (
                          <p className="text-xs text-[var(--text-muted)]">
                            No paid invoices found. Make sure invoices have paymentStatus = "Paid" or "Partially Paid".
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)]"
                    >
                      <td className="py-3 px-4">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{payment.companyName}</td>
                      <td className="py-3 px-4">{payment.planName}</td>
                      <td className="py-3 px-4">
                        ${payment.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            payment.paymentStatus === "Paid" || payment.paymentStatus === "succeeded"
                              ? "bg-[var(--success)]/20 text-[var(--success)]"
                              : payment.paymentStatus === "Failed" || payment.paymentStatus === "failed"
                              ? "bg-[var(--error)]/20 text-[var(--error)]"
                              : payment.paymentStatus === "Pending" || payment.paymentStatus === "pending"
                              ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                              : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
                          }`}
                        >
                          {payment.paymentStatus === "succeeded" ? "Paid" : 
                           payment.paymentStatus === "failed" ? "Failed" :
                           payment.paymentStatus === "pending" ? "Pending" :
                           payment.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="text-xs text-[var(--primary)] hover:underline"
                          onClick={() => {
                            // TODO: Implement invoice download
                            showToast("Invoice download coming soon", "info");
                          }}
                        >
                          {t("payments.downloadInvoice")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

