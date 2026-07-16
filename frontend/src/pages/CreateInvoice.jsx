import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useToast } from "../components/Toaster.jsx";
import {
  FileText,
  ArrowLeft,
  Loader2,
  Calculator,
  Building,
  CreditCard,
} from "lucide-react";
import { fetchAllCompanies } from "../api/api";

const NEXORA_API_URL =
  import.meta.env.VITE_NEXORA_API_URL || "http://localhost:5000/api";

// Subscription plan prices (monthly)
const PLAN_PRICES = {
  Basic: 199,
  Pro: 399,
  Enterprise: 599,
};

const PLANS = ["Basic", "Pro", "Enterprise"];
const DURATIONS = ["Monthly", "Quarterly", "Yearly"];

// Calculate price based on plan and duration
const calculateSubscriptionPrice = (plan, duration) => {
  const basePrice = PLAN_PRICES[plan] || 0;
  if (!basePrice) return 0;

  switch (duration) {
    case "Monthly":
      return basePrice;
    case "Quarterly":
      // 10% discount for quarterly
      return basePrice * 3 * 0.9;
    case "Yearly":
      // 20% discount for yearly
      return basePrice * 12 * 0.8;
    default:
      return basePrice;
  }
};

const CreateInvoice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [formData, setFormData] = useState({
    companyId: "",
    plan: "Basic",
    duration: "Monthly",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    taxRate: 0,
    notes: "",
    paymentTerms: "Net 30",
  });

  const [submitting, setSubmitting] = useState(false);

  // Load companies
  useEffect(() => {
    const load = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const data = await fetchAllCompanies(token);
        setCompanies(Array.isArray(data) ? data : []);
      } catch (e) {
        showToast(e?.message || "Failed to load companies", "error");
      } finally {
        setLoadingCompanies(false);
      }
    };
    load();
  }, [showToast]);

  // Calculate subscription totals
  const subscriptionPrice = useMemo(() => {
    return calculateSubscriptionPrice(formData.plan, formData.duration);
  }, [formData.plan, formData.duration]);

  const totals = useMemo(() => {
    const subtotal = subscriptionPrice;
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, discountAmount: 0, taxAmount, totalAmount };
  }, [subscriptionPrice, formData.taxRate]);

  // Get selected company
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c._id === formData.companyId);
  }, [companies, formData.companyId]);

  // Update plan and duration when company is selected
  useEffect(() => {
    if (selectedCompany && selectedCompany.subscription) {
      setFormData((prev) => ({
        ...prev,
        plan: selectedCompany.subscription.plan || prev.plan,
        duration: selectedCompany.subscription.duration || prev.duration,
      }));
    }
  }, [selectedCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyId) {
      showToast(t("invoices.selectCompany") || "Please select a company", "error");
      return;
    }

    if (!formData.plan || !formData.duration) {
      showToast("Please select a subscription plan and duration", "error");
      return;
    }

    try {
      setSubmitting(true);
      
      // Create subscription invoice item
      const subscriptionItem = {
        description: `${formData.plan} Plan - ${formData.duration} Subscription`,
        quantity: 1,
        unitPrice: subscriptionPrice,
        discount: 0,
        taxRate: 0,
        total: subscriptionPrice,
      };

      // Prepare invoice data with subscription item
      const invoiceData = {
        ...formData,
        items: [subscriptionItem],
        globalDiscount: { type: "percentage", value: 0 },
      };

      // Remove plan and duration from invoice data (they're only for UI)
      delete invoiceData.plan;
      delete invoiceData.duration;

      // Create invoice via Nexora API using SuperAdmin endpoint
      const res = await axios.post(
        `${NEXORA_API_URL}/invoices/superadmin/create`,
        invoiceData,
        {
          withCredentials: true,
        }
      );

      showToast(t("invoices.createdSuccessfully") || "Invoice created successfully", "success");
      navigate(`/invoices/${res.data.data._id}`);
    } catch (err) {
      showToast(
        err.response?.data?.message || t("invoices.failedToCreate") || "Failed to create invoice",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/invoices")}
          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--gray-50)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <FileText className="w-6 h-6 text-[var(--primary)]" />
            {t("invoices.createInvoice")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t("invoices.createSubscriptionInvoice")}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="form-shell-wide space-y-6">
        {/* Company Selection */}
        <div className="card card-elevated p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)]">
            {t("invoices.selectCompany")}
          </h2>
          {loadingCompanies ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs text-[var(--text-muted)]">
                {t("invoices.loadingCompanies")}
              </span>
            </div>
          ) : (
            <select
              value={formData.companyId}
              onChange={(e) =>
                setFormData({ ...formData, companyId: e.target.value, customerId: "" })
              }
              className="input"
              required
            >
              <option value="">{t("invoices.selectCompany")}</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name} ({company.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Subscription Information */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Subscription Details
          </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                Subscription Plan *
              </label>
              <select
                value={formData.plan}
                onChange={(e) =>
                  setFormData({ ...formData, plan: e.target.value })
                }
                className="w-full px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
                required
              >
                {PLANS.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan} - ${PLAN_PRICES[plan]}/month
                  </option>
                ))}
              </select>
                </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                Duration *
              </label>
                <select
                value={formData.duration}
                  onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                  }
                  className="w-full px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
                required
              >
                {DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                    </option>
                  ))}
                </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                Subscription Price
              </label>
              <div className="px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text)] font-semibold">
                ${subscriptionPrice.toFixed(2)}
                {formData.duration === "Quarterly" && (
                  <span className="ml-2 text-[var(--text-muted)] text-xs font-normal">
                    (10% discount)
                  </span>
                )}
                {formData.duration === "Yearly" && (
                  <span className="ml-2 text-[var(--text-muted)] text-xs font-normal">
                    (20% discount)
                  </span>
                )}
              </div>
            </div>
            {selectedCompany && selectedCompany.subscription?.plan && (
              <div>
                <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                  Current Plan
                </label>
                <div className="px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)]">
                  {selectedCompany.subscription.plan}
                  {selectedCompany.subscription.duration && ` - ${selectedCompany.subscription.duration}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)]">
            {t("invoices.basicInformation") || "Basic Information"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                {t("invoices.issueDate") || "Issue Date"} *
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
                className="w-full px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                {t("invoices.dueDate") || "Due Date"} *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                {t("invoices.paymentTerms") || "Payment Terms"}
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData({ ...formData, paymentTerms: e.target.value })
                }
                className="w-full px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
                placeholder="Net 30"
              />
            </div>
          </div>
        </div>

        {/* Subscription Item Preview */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)]">
            Invoice Item
            </h2>
          <div className="p-3 border border-[var(--border)] bg-[var(--bg-alt)]">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-12 md:col-span-6">
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
                  Description
                </div>
                <div className="text-xs text-[var(--text)]">
                  {formData.plan} Plan - {formData.duration} Subscription
          </div>
                  </div>
              <div className="col-span-4 md:col-span-2">
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
                  Quantity
                  </div>
                <div className="text-xs text-[var(--text)]">1</div>
                  </div>
              <div className="col-span-4 md:col-span-2">
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
                  Unit Price
                  </div>
                <div className="text-xs text-[var(--text)] font-semibold">
                  ${subscriptionPrice.toFixed(2)}
                    </div>
                  </div>
              <div className="col-span-4 md:col-span-2">
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
                  Total
                  </div>
                <div className="text-xs text-[var(--text)] font-semibold">
                  ${subscriptionPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tax */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)]">
            Tax
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
                {t("invoices.taxRate") || "Tax Rate"} (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--text-secondary)]"
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg-alt)]">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {t("invoices.summary") || "Summary"}
            </h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[var(--text)]">
              <span>{t("invoices.subtotal") || "Subtotal"}:</span>
              <span className="font-semibold">
                ${totals.subtotal.toFixed(2)}
              </span>
            </div>
            {formData.duration === "Quarterly" && (
              <div className="flex justify-between text-green-600">
                <span>Quarterly Discount (10%):</span>
                <span className="font-semibold">
                  -${((subscriptionPrice / 0.9) - subscriptionPrice).toFixed(2)}
                </span>
              </div>
            )}
            {formData.duration === "Yearly" && (
              <div className="flex justify-between text-green-600">
                <span>Yearly Discount (20%):</span>
                <span className="font-semibold">
                  -${((subscriptionPrice / 0.8) - subscriptionPrice).toFixed(2)}
                </span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-[var(--text)]">
                <span>
                  {t("invoices.tax") || "Tax"} ({formData.taxRate}%):
                </span>
                <span className="font-semibold">
                  ${totals.taxAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-[var(--border)] text-[var(--text-secondary)]">
              <span>{t("invoices.total") || "Total"}:</span>
              <span>${totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
          <label className="block text-xs font-medium mb-2 text-[var(--text-muted)] uppercase tracking-wider">
            {t("invoices.notes")} {t("invoices.optional")}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2 text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] resize-none focus:outline-none focus:border-[var(--text-secondary)]"
          />
        </div>

        {/* Submit Button */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="btn btn-secondary btn-compact"
          >
            {t("invoices.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.companyId}
            className="btn btn-primary btn-compact disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("invoices.creating")}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                {t("invoices.createInvoice")}
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default CreateInvoice;

