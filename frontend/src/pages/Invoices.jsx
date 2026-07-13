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

const getStatusColor = (status) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "Sent":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Paid":
      return "bg-green-100 text-green-700 border-green-300";
    case "Overdue":
      return "bg-red-100 text-red-700 border-red-300";
    case "Cancelled":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
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

  // Filter invoices by search term and show only company invoices (no customer invoices)
  const filteredInvoices = invoices
    .filter((invoice) => {
      // Only show invoices without customerId (company invoices for subscriptions)
      return !invoice.customerId || invoice.customerId === null;
    })
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
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--primary)]" />
            <p className="text-[var(--text-muted)]">{t("invoices.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-wider uppercase text-[var(--text-secondary)] flex items-center gap-3">
            <FileText className="w-6 h-6" />
            {t("invoices.title")}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t("invoices.subtitle")}
          </p>
        </div>
        <button
          onClick={() => navigate("/invoices/create")}
          className="px-4 py-2 text-xs uppercase tracking-wider border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-secondary)] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("invoices.createInvoice")}
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              {t("invoices.total")}
            </p>
            <p className="text-2xl font-light text-[var(--text-secondary)]">
              {stats.total || 0}
            </p>
          </div>
          <div className="p-4 border border-gray-300 bg-gray-50">
            <p className="text-xs text-gray-700 uppercase tracking-wider mb-1">
              {t("invoices.draft")}
            </p>
            <p className="text-2xl font-light text-gray-700">
              {stats.draft || 0}
            </p>
          </div>
          <div className="p-4 border border-blue-300 bg-blue-50">
            <p className="text-xs text-blue-700 uppercase tracking-wider mb-1">
              {t("invoices.sent")}
            </p>
            <p className="text-2xl font-light text-blue-700">
              {stats.sent || 0}
            </p>
          </div>
          <div className="p-4 border border-green-300 bg-green-50">
            <p className="text-xs text-green-700 uppercase tracking-wider mb-1">
              {t("invoices.paid")}
            </p>
            <p className="text-2xl font-light text-green-700">
              {stats.paid || 0}
            </p>
          </div>
          <div className="p-4 border border-red-300 bg-red-50">
            <p className="text-xs text-red-700 uppercase tracking-wider mb-1">
              {t("invoices.overdue")}
            </p>
            <p className="text-2xl font-light text-red-700">
              {stats.overdue || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 border border-[var(--border)] bg-[var(--bg)]">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
              {t("invoices.filters")}:
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t("invoices.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
          >
            <option value="all">{t("invoices.allStatus")}</option>
            <option value="Draft">{t("invoices.draft")}</option>
            <option value="Sent">{t("invoices.sent")}</option>
            <option value="Paid">{t("invoices.paid")}</option>
            <option value="Overdue">{t("invoices.overdue")}</option>
            <option value="Cancelled">{t("invoices.cancelled")}</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-[var(--text-muted)]">{t("invoices.noInvoicesFound")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice._id}
              className="p-4 border border-[var(--border)] bg-[var(--bg)] transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText
                      size={24}
                      className="text-[var(--primary)]"
                    />
                    <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                      {invoice.invoiceNumber}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {t(`invoices.status.${invoice.status.toLowerCase()}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-2">
                    {invoice.companyId && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {invoice.companyId.name || t("invoices.unknownCompany")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                    </span>
                    {invoice.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 font-semibold">
                      <DollarSign size={16} />
                      {invoice.totalAmount?.toFixed(2) || "0.00"} {invoice.currency || "USD"}
                    </span>
                    {invoice.paidAmount > 0 && (
                      <span className="text-green-600">
                        {t("invoices.paid")}: {invoice.paidAmount.toFixed(2)}{" "}
                        {invoice.currency || "USD"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                    title={t("invoices.view")}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(invoice._id)}
                    className="p-2 text-purple-600 hover:bg-purple-50 transition-colors"
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
    </div>
  );
}

