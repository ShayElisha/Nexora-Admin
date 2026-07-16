import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchAllInvoices,
  fetchInvoiceStats,
  downloadInvoicePDF,
} from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import { format } from "date-fns";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Building,
  DollarSign,
  Calendar,
  RefreshCw,
  Plus,
} from "lucide-react";
import PageShell from "../components/ui/PageShell.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Toolbar from "../components/ui/Toolbar.jsx";
import ErrorPanel from "../components/ui/ErrorPanel.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const getStatusColor = (status) => {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Sent":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Paid":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "Overdue":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function Invoices() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 15;

  useEffect(() => {
    loadInvoices();
    loadStats();
  }, [currentPage, filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page: currentPage,
        limit: invoicesPerPage,
        ...(filterStatus !== "all" && { status: filterStatus }),
      };
      const data = await fetchAllInvoices(params);
      setInvoices(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      setError(e?.message || t("invoices.failedToLoad"));
      showToast(e?.message || t("invoices.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchInvoiceStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const handleDownloadPDF = (invoiceId) => {
    window.open(downloadInvoicePDF(invoiceId), "_blank");
  };

  const filteredInvoices = invoices
    .filter((invoice) => !invoice.customerId || invoice.customerId === null)
    .filter((invoice) => {
      const term = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber?.toLowerCase().includes(term) ||
        invoice.companyId?.name?.toLowerCase().includes(term) ||
        invoice.companyId?.email?.toLowerCase().includes(term)
      );
    });

  if (loading && !invoices.length) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-28">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p className="text-[var(--text-muted)]">{t("invoices.loading")}</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={t("invoices.title")}
        subtitle={t("invoices.subtitle")}
        icon={<FileText className="w-5 h-5" />}
        actions={
          <button
            onClick={() => navigate("/invoices/create")}
            className="btn btn-primary btn-compact flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("invoices.createInvoice")}
          </button>
        }
      />

      {stats && (
        <div className="kpi-grid">
          <div className="kpi-card kpi-card-slate">
            <p className="kpi-label">{t("invoices.total")}</p>
            <p className="kpi-value">{stats.total || 0}</p>
          </div>
          <div className="kpi-card kpi-card-slate">
            <p className="kpi-label">{t("invoices.draft")}</p>
            <p className="kpi-value">{stats.draft || 0}</p>
          </div>
          <div className="kpi-card kpi-card-blue">
            <p className="kpi-label">{t("invoices.sent")}</p>
            <p className="kpi-value">{stats.sent || 0}</p>
          </div>
          <div className="kpi-card kpi-card-green">
            <p className="kpi-label">{t("invoices.paid")}</p>
            <p className="kpi-value">{stats.paid || 0}</p>
          </div>
          <div className="kpi-card kpi-card-rose">
            <p className="kpi-label">{t("invoices.overdue")}</p>
            <p className="kpi-value">{stats.overdue || 0}</p>
          </div>
        </div>
      )}

      <Toolbar>
        <div className="flex items-center gap-2 shrink-0 text-[var(--text-muted)]">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">{t("invoices.filters")}</span>
        </div>
        <div className="relative flex-1 min-w-[12rem] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder={t("invoices.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input ps-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="input !w-auto shrink-0"
        >
          <option value="all">{t("invoices.allStatus")}</option>
          <option value="Draft">{t("invoices.draft")}</option>
          <option value="Sent">{t("invoices.sent")}</option>
          <option value="Paid">{t("invoices.paid")}</option>
          <option value="Overdue">{t("invoices.overdue")}</option>
          <option value="Cancelled">{t("invoices.cancelled")}</option>
        </select>
      </Toolbar>

      {error ? (
        <ErrorPanel message={error} onRetry={loadInvoices} />
      ) : filteredInvoices.length === 0 ? (
        <div className="card card-elevated">
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title={t("invoices.noInvoicesFound")}
            description={t("empty.description")}
          />
        </div>
      ) : (
        <div className="list-stack">
          {filteredInvoices.map((invoice) => (
            <div key={invoice._id} className="list-item">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {invoice.invoiceNumber}
                    </h3>
                    <span
                      className={`soft-badge border ${getStatusColor(invoice.status)}`}
                    >
                      {t(`invoices.status.${invoice.status.toLowerCase()}`)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--text-muted)] mb-2">
                    {invoice.companyId && (
                      <span className="inline-flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        {invoice.companyId.name || t("invoices.unknownCompany")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                    </span>
                    {invoice.dueDate && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("invoices.duePrefix")} {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                      <DollarSign className="w-4 h-4 text-[var(--primary)]" />
                      {invoice.totalAmount?.toFixed(2) || "0.00"}{" "}
                      {invoice.currency || "USD"}
                    </span>
                    {invoice.paidAmount > 0 && (
                      <span className="text-teal-700">
                        {t("invoices.paid")}: {invoice.paidAmount.toFixed(2)}{" "}
                        {invoice.currency || "USD"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                    className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--primary)]/8 transition-colors"
                    title={t("invoices.view")}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(invoice._id)}
                    className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--gray-50)] transition-colors"
                    title={t("invoices.downloadPDF")}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
