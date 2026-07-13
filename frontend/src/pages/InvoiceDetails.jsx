import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchInvoiceById, downloadInvoicePDF } from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import { format } from "date-fns";
import {
  FileText,
  ArrowLeft,
  Download,
  RefreshCw,
  DollarSign,
  Calendar,
  Building,
  User,
  CheckCircle,
  Printer,
  CreditCard,
  Calculator,
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

export default function InvoiceDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoiceById(id);
      setInvoice(data);
    } catch (e) {
      setError(e?.message || t("invoices.failedToFetch"));
      showToast(e?.message || t("invoices.failedToFetch"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdfUrl = downloadInvoicePDF(id);
    window.open(pdfUrl, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
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

  if (error || !invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-500">{error || t("invoices.invoiceNotFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 print:p-0">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          body {
            background: white !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/invoices")}
            className="p-2 border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-alt)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-light tracking-wider uppercase text-[var(--text-secondary)] flex items-center gap-3">
              <FileText className="w-6 h-6" />
              {invoice.invoiceNumber}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                  invoice.status
                )}`}
              >
                {t(`invoices.status.${invoice.status.toLowerCase()}`)}
              </span>
              {invoice.paymentStatus && (
                <span className="text-xs text-[var(--text-muted)]">
                  {t("invoices.paymentStatus")}:{" "}
                  {t(`invoices.paymentStatus.${invoice.paymentStatus.toLowerCase().replace(' ', '')}`)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-secondary)] transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider border border-[var(--border)] bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors"
          >
            <FileText className="w-4 h-4" />
            {t("invoices.downloadPDF") || "Download PDF"}
          </button>
        </div>
      </div>

      {/* Invoice Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Company Info */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-[var(--text-secondary)]">
            {t("invoices.from")}
          </h2>
          <div className="space-y-2 text-xs text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text-secondary)]">
              {invoice.companyId?.name || t("invoices.unknownCompany")}
            </p>
            {invoice.companyId?.email && <p>{invoice.companyId.email}</p>}
            {invoice.companyId?.phone && <p>{invoice.companyId.phone}</p>}
            {invoice.companyId?.address && (
              <div>
                {invoice.companyId.address.street && (
                  <p>{invoice.companyId.address.street}</p>
                )}
                <p>
                  {invoice.companyId.address.city}
                  {invoice.companyId.address.state &&
                    `, ${invoice.companyId.address.state}`}
                  {invoice.companyId.address.postalCode &&
                    ` ${invoice.companyId.address.postalCode}`}
                </p>
                {invoice.companyId.address.country && (
                  <p>{invoice.companyId.address.country}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        {invoice.items && invoice.items.length > 0 && invoice.items[0].description?.includes("Subscription") && (
          <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-[var(--text-secondary)] flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Subscription Details
            </h2>
            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <p className="font-semibold text-[var(--text-secondary)]">
                {invoice.items[0].description}
              </p>
              <p>
                Plan: {invoice.items[0].description.match(/(Basic|Pro|Enterprise)/)?.[0] || "Unknown"}
              </p>
              <p>
                Duration: {invoice.items[0].description.match(/(Monthly|Quarterly|Yearly)/)?.[0] || "Unknown"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Dates */}
      <div className="p-4 border border-[var(--border)] bg-[var(--bg)] mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {t("invoices.issueDate")}
              </p>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {format(new Date(invoice.issueDate), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {t("invoices.dueDate")}
              </p>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {format(new Date(invoice.dueDate), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {invoice.paymentTerms && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-[var(--text-muted)]" />
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  {t("invoices.paymentTerms")}
                </p>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  {invoice.paymentTerms}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="p-4 border border-[var(--border)] bg-[var(--bg)] mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)]">
          {t("invoices.items")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-[var(--text-muted)] uppercase tracking-wider">
                  {t("invoices.description")}
                </th>
                <th className="text-right py-3 px-4 text-[var(--text-muted)] uppercase tracking-wider">
                  {t("invoices.quantity")}
                </th>
                <th className="text-right py-3 px-4 text-[var(--text-muted)] uppercase tracking-wider">
                  {t("invoices.unitPrice")}
                </th>
                <th className="text-right py-3 px-4 text-[var(--text-muted)] uppercase tracking-wider">
                  {t("invoices.discount")}
                </th>
                <th className="text-right py-3 px-4 text-[var(--text-muted)] uppercase tracking-wider">
                  {t("invoices.total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index} className="border-b border-[var(--border)]">
                  <td className="py-3 px-4 text-[var(--text)]">{item.description}</td>
                  <td className="text-right py-3 px-4 text-[var(--text)]">
                    {item.quantity}
                  </td>
                  <td className="text-right py-3 px-4 text-[var(--text)]">
                    {invoice.currency || "USD"} {item.unitPrice?.toFixed(2) || "0.00"}
                  </td>
                  <td className="text-right py-3 px-4 text-[var(--text)]">
                    {item.discount > 0 ? `${item.discount}%` : "-"}
                  </td>
                  <td className="text-right py-3 px-4 font-semibold text-[var(--text-secondary)]">
                    {invoice.currency || "USD"} {item.total?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Totals */}
        <div className="p-6 border border-[var(--border)] bg-[var(--bg-alt)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)] flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Invoice Summary
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-[var(--text)]">
              <span>{t("invoices.subtotal") || "Subtotal"}:</span>
              <span className="font-semibold">
                {invoice.currency || "USD"} {invoice.subtotal?.toFixed(2) || "0.00"}
              </span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>{t("invoices.discount") || "Discount"}:</span>
                <span className="font-semibold">
                  -{invoice.currency || "USD"}{" "}
                  {invoice.discountAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-[var(--text)]">
                <span>
                  {t("invoices.tax") || "Tax"} ({invoice.taxRate}%):
                </span>
                <span className="font-semibold">
                  {invoice.currency || "USD"} {invoice.taxAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-[var(--border)] text-[var(--text-secondary)]">
              <span>{t("invoices.total") || "Total"}:</span>
              <span>
                {invoice.currency || "USD"} {invoice.totalAmount?.toFixed(2) || "0.00"}
              </span>
            </div>
            {invoice.paidAmount > 0 && (
              <>
                <div className="flex justify-between text-green-600 pt-3 border-t border-[var(--border)]">
                  <span>{t("invoices.paid") || "Paid"}:</span>
                  <span className="font-semibold">
                    {invoice.currency || "USD"}{" "}
                    {invoice.paidAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)]">
                  <span>{t("invoices.balance") || "Balance"}:</span>
                  <span>
                    {invoice.currency || "USD"}{" "}
                    {(invoice.totalAmount - invoice.paidAmount)?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="p-6 border border-[var(--border)] bg-[var(--bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)]">
            Payment Information
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Status:</span>
              <span className={`font-semibold ${getStatusColor(invoice.status).split(' ')[0]}`}>
                {invoice.status}
              </span>
            </div>
            {invoice.paymentStatus && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Payment Status:</span>
                <span className="font-semibold text-[var(--text-secondary)]">
                  {invoice.paymentStatus}
                </span>
              </div>
            )}
            {invoice.paymentDate && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Payment Date:</span>
                <span className="font-semibold text-[var(--text-secondary)]">
                  {format(new Date(invoice.paymentDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
            {invoice.paymentTerms && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Payment Terms:</span>
                <span className="font-semibold text-[var(--text-secondary)]">
                  {invoice.paymentTerms}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)] mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">
            {t("invoices.notes")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
}

