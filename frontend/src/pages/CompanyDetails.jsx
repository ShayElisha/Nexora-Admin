import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchAllCompanies, fetchAllPayments } from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import SectionCard from "../components/ui/SectionCard.jsx";
import MetricCard from "../components/ui/MetricCard.jsx";

export default function CompanyDetails() {
  const { companyId } = useParams();
  const id = companyId;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [internalNotes, setInternalNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const companies = await fetchAllCompanies(token);
        const found = Array.isArray(companies) ? companies.find((c) => c._id === id) : null;

        if (!found) {
          setError(t("companyDetails.notFound"));
        } else {
          setCompany(found);
          // Load internal notes from localStorage
          const savedNotes = localStorage.getItem(`company_notes_${id}`);
          if (savedNotes) {
            setInternalNotes(JSON.parse(savedNotes));
          }
        }
      } catch (e) {
        setError(e?.message || t("companyDetails.failedToLoad"));
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [id]);

  useEffect(() => {
    if (company && activeTab === "payments") {
      loadPayments();
    }
  }, [company, activeTab]);

  const loadPayments = async () => {
    if (paymentsLoading || payments.length > 0) return;
    
    try {
      setPaymentsLoading(true);
      const paymentsResponse = await fetchAllPayments({
        companyId: id,
        page: 1,
        limit: 1000,
      });

      let paymentsData = [];
      if (Array.isArray(paymentsResponse)) {
        paymentsData = paymentsResponse;
      } else if (paymentsResponse?.data && Array.isArray(paymentsResponse.data)) {
        paymentsData = paymentsResponse.data;
      } else if (paymentsResponse?.pagination?.data) {
        paymentsData = paymentsResponse.pagination.data;
      }

      const formattedPayments = paymentsData
        .filter((p) => {
          const compId = typeof p.companyId === 'object' ? p.companyId?._id : p.companyId;
          return compId === id;
        })
        .map((payment) => ({
          id: payment._id,
          amount: payment.amount || 0,
          currency: payment.currency?.toUpperCase() || "USD",
          planName: payment.planName || "Unknown",
          paymentDate: payment.paymentDate || payment.createdAt || new Date(),
          paymentStatus: payment.paymentStatus === "succeeded" ? "Paid" : payment.paymentStatus,
          isRecurring: payment.isRecurring || false,
        }))
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

      setPayments(formattedPayments);
    } catch (err) {
      console.error("Error loading payments:", err);
      showToast(t("companyDetails.failedToLoadPayments"), "error");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const addInternalNote = () => {
    if (!newNote.trim()) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const note = {
      id: Date.now(),
      text: newNote.trim(),
      author: user?.name || user?.email || "Admin",
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [note, ...internalNotes];
    setInternalNotes(updatedNotes);
    localStorage.setItem(`company_notes_${id}`, JSON.stringify(updatedNotes));
    setNewNote("");
    showToast(t("companyDetails.noteAdded"), "success");
  };

  const deleteInternalNote = (noteId) => {
    const updatedNotes = internalNotes.filter((n) => n.id !== noteId);
    setInternalNotes(updatedNotes);
    localStorage.setItem(`company_notes_${id}`, JSON.stringify(updatedNotes));
    showToast(t("companyDetails.noteDeleted"), "success");
  };

  // Prepare performance chart data
  const performanceChartData = useMemo(() => {
    if (!payments.length) return [];

    const monthlyData = {};
    payments.forEach((payment) => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: 0,
          payments: 0,
        };
      }
      
      monthlyData[monthKey].revenue += payment.amount;
      monthlyData[monthKey].payments += 1;
    });

    return Object.values(monthlyData)
      .sort((a, b) => {
        const aDate = new Date(a.month);
        const bDate = new Date(b.month);
        return aDate - bDate;
      })
      .slice(-12); // Last 12 months
  }, [payments]);

  // Calculate usage statistics
  const usageStats = useMemo(() => {
    if (!company) return null;

    const daysSinceRegistration = Math.floor(
      (new Date() - new Date(company.createdAt)) / (1000 * 60 * 60 * 24)
    );
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const averagePayment = payments.length > 0 ? totalRevenue / payments.length : 0;
    const lastPaymentDate = payments.length > 0 ? payments[0].paymentDate : null;

    return {
      daysSinceRegistration,
      totalRevenue,
      totalPayments: payments.length,
      averagePayment,
      lastPaymentDate,
      plan: company.subscription?.plan || t("companyDetails.noPlan"),
    };
  }, [company, payments]);

  if (loading) {
    return (
      <div className="min-h-screen pt-6 pb-16 flex items-center justify-center">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen pt-6 pb-16">
        <div className="container">
          <div className="mb-8">
            <button
              onClick={() => navigate("/companies")}
              className="text-sm text-[var(--gray-500)] hover:text-[var(--black)] mb-8"
            >
              ← {t("companyDetails.backToCompanies")}
            </button>
          </div>
          <div className="card border p-8 text-center">
            <p className="text-[var(--gray-700)]">{error || t("companyDetails.notFound")}</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: t("companyDetails.tabs.overview") },
    { id: "performance", label: t("companyDetails.tabs.performance") },
    { id: "payments", label: t("companyDetails.tabs.paymentHistory") },
    { id: "usage", label: t("companyDetails.tabs.usageAnalytics") },
    { id: "notes", label: t("companyDetails.tabs.notes") },
  ];

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container">
        {/* Back Button */}
        <button
          onClick={() => navigate("/companies")}
          className="text-sm text-[var(--gray-500)] hover:text-[var(--black)] mb-8 animate-in"
        >
          ← {t("companyDetails.backToCompanies")}
        </button>

        {/* Header */}
        <div className="mb-12 animate-in">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold text-3xl">
              {company.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold mb-3 tracking-tight text-[var(--text-primary)]">
                {company.name}
              </h1>
              <StatusBadge status={company.status} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-[var(--gray-200)] animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[var(--black)] text-[var(--black)]"
                    : "border-transparent text-[var(--gray-500)] hover:text-[var(--gray-700)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in" style={{ animationDelay: "0.2s" }}>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SectionCard title={t("companyDetails.contact")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="field-label">{t("companies.email")}</div>
                      <div className="field-value">{company.email || "—"}</div>
                    </div>
                    <div>
                      <div className="field-label">{t("companies.phone")}</div>
                      <div className="field-value">{company.phone || "—"}</div>
                    </div>
                    <div>
                      <div className="field-label">{t("companies.status")}</div>
                      <StatusBadge status={company.status} />
                    </div>
                    <div>
                      <div className="field-label">{t("companyDetails.registrationDate")}</div>
                      <div className="field-value">
                        {company.createdAt
                          ? new Date(company.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title={t("companies.plan")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="field-label">{t("companyDetails.currentPlan")}</div>
                      <div className="field-value text-lg font-semibold">
                        {company.subscription?.plan || t("companyDetails.noPlan")}
                      </div>
                    </div>
                    {company.subscription?.startDate && (
                      <div>
                        <div className="field-label">{t("payments.startDate")}</div>
                        <div className="field-value">
                          {new Date(company.subscription.startDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    )}
                    {company.subscription?.endDate && (
                      <div>
                        <div className="field-label">{t("payments.endDate")}</div>
                        <div className="field-value">
                          {new Date(company.subscription.endDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard title={t("companyDetails.activity")}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                      label={t("companyDetails.accountAge")}
                      value={`${usageStats?.daysSinceRegistration ?? 0}d`}
                      hint={t("companyDetails.sinceRegistration")}
                      tone="blue"
                    />
                    <MetricCard
                      label={t("companyDetails.totalPayments")}
                      value={usageStats?.totalPayments ?? 0}
                      hint={t("companyDetails.recordedTransactions")}
                      tone="green"
                    />
                    <MetricCard
                      label={t("payments.totalRevenue")}
                      value={`$${(usageStats?.totalRevenue ?? 0).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`}
                      hint={t("companyDetails.lifetimeBilled")}
                      tone="orange"
                    />
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard title={t("companyDetails.quickActions")}>
                  <div className="space-y-3">
                    <button className="btn btn-primary w-full">{t("communication.sendMessage")}</button>
                    <button className="btn btn-secondary w-full">{t("companyDetails.viewDocuments")}</button>
                    <button className="btn btn-secondary w-full">{t("companyDetails.editCompany")}</button>
                  </div>
                </SectionCard>

                <SectionCard title={t("companyDetails.additionalInfo")}>
                  <div className="field-label">{t("companyDetails.companyId")}</div>
                  <div className="field-value font-mono text-xs break-all text-[var(--text-secondary)]">
                    {company._id}
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="space-y-8">
              <div className="card border p-8">
                <h2 className="text-2xl font-light mb-6">{t("companyDetails.performanceOverview")}</h2>
                {performanceChartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceChartData}>
                        <defs>
                          <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg)",
                            border: "1px solid var(--gray-300)",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2563eb"
                          fill="url(#performanceGradient)"
                          strokeWidth={2}
                          name={t("analytics.charts.revenue")}
                        />
                        <Line
                          type="monotone"
                          dataKey="payments"
                          stroke="#10b981"
                          strokeWidth={2}
                          name={t("companyDetails.totalPayments")}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--gray-500)]">
                    {t("companyDetails.noPaymentData")}
                  </div>
                )}
              </div>

              {/* Performance Stats */}
              {usageStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card border p-6">
                    <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                      {t("payments.totalRevenue")}
                    </div>
                    <div className="text-3xl font-light">
                      ${usageStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="card border p-6">
                    <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                      {t("companyDetails.totalPayments")}
                    </div>
                    <div className="text-3xl font-light">{usageStats.totalPayments}</div>
                  </div>
                  <div className="card border p-6">
                    <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                      {t("companyDetails.averagePayment")}
                    </div>
                    <div className="text-3xl font-light">
                      ${usageStats.averagePayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === "payments" && (
            <div className="space-y-8">
              <div className="card border p-8">
                <h2 className="text-2xl font-light mb-6">{t("companyDetails.tabs.paymentHistory")}</h2>
                {paymentsLoading ? (
                  <div className="text-center py-12">
                    <div className="spinner mx-auto mb-4" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
                    <p className="text-[var(--gray-500)]">{t("companyDetails.loadingPayments")}</p>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--gray-200)]">
                          <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                            {t("payments.date")}
                          </th>
                          <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                            {t("payments.amount")}
                          </th>
                          <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                            {t("companies.plan")}
                          </th>
                          <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                            {t("companies.status")}
                          </th>
                          <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                            {t("common.type")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-[var(--gray-100)] hover:bg-[var(--gray-50)]">
                            <td className="py-3 px-4 text-[var(--gray-700)] font-light">
                              {new Date(payment.paymentDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-4 text-[var(--gray-700)] font-medium">
                              {payment.currency} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-[var(--gray-700)] font-light">{payment.planName}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`badge ${
                                  payment.paymentStatus === "Paid"
                                    ? "badge-success"
                                    : payment.paymentStatus === "Failed"
                                    ? "badge-error"
                                    : "badge-warning"
                                }`}
                              >
                                {payment.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[var(--gray-700)] font-light">
                              {payment.isRecurring
                                ? t("companyDetails.recurring")
                                : t("companyDetails.oneTime")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--gray-500)]">
                    {t("companyDetails.noPaymentHistory")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usage Analytics Tab */}
          {activeTab === "usage" && usageStats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card border p-6">
                  <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                    {t("companyDetails.daysActive")}
                  </div>
                  <div className="text-3xl font-light">{usageStats.daysSinceRegistration}</div>
                  <div className="text-sm text-[var(--gray-500)] mt-1">
                    {t("companyDetails.sinceRegistration")}
                  </div>
                </div>
                <div className="card border p-6">
                  <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                    {t("companyDetails.currentPlan")}
                  </div>
                  <div className="text-3xl font-light">{usageStats.plan}</div>
                </div>
                <div className="card border p-6">
                  <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                    {t("companyDetails.totalPayments")}
                  </div>
                  <div className="text-3xl font-light">{usageStats.totalPayments}</div>
                </div>
                <div className="card border p-6">
                  <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                    {t("companyDetails.lastPayment")}
                  </div>
                  <div className="text-lg font-light">
                    {usageStats.lastPaymentDate
                      ? new Date(usageStats.lastPaymentDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : t("companyDetails.never")}
                  </div>
                </div>
              </div>

              <div className="card border p-8">
                <h2 className="text-2xl font-light mb-6">{t("companyDetails.revenueTrend")}</h2>
                {performanceChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg)",
                            border: "1px solid var(--gray-300)",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2563eb"
                          strokeWidth={2}
                          name={t("analytics.charts.revenue")}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--gray-500)]">
                    {t("companyDetails.noUsageData")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Internal Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-8">
              <div className="card border p-8">
                <h2 className="text-2xl font-light mb-6">{t("companyDetails.internalNotes")}</h2>
                
                {/* Add Note Form */}
                <div className="mb-8 pb-8 border-b border-[var(--gray-200)]">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={t("companyDetails.notePlaceholder")}
                    className="input w-full mb-4"
                    rows={4}
                  />
                  <button onClick={addInternalNote} className="btn btn-primary">
                    {t("companyDetails.addNote")}
                  </button>
                </div>

                {/* Notes List */}
                {internalNotes.length > 0 ? (
                  <div className="space-y-4">
                    {internalNotes.map((note) => (
                      <div key={note.id} className="border border-[var(--gray-200)] rounded-lg p-6 bg-[var(--gray-50)]">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-[var(--gray-900)]">{note.author}</div>
                            <div className="text-sm text-[var(--gray-500)] font-light">
                              {new Date(note.createdAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteInternalNote(note.id)}
                            className="text-[var(--gray-500)] hover:text-[var(--red)] transition-colors"
                            aria-label={t("companyDetails.deleteNote")}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="text-[var(--gray-700)] font-light whitespace-pre-wrap">{note.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--gray-500)]">
                    {t("companyDetails.noNotesYet")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
