import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAllCompanies, updateCompanyStatus } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function SubscriptionManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const data = await fetchAllCompanies(token);
        setCompanies(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || t("subscriptions.failedToLoad"));
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [t]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateSubscription = async (companyId, subscriptionData) => {
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      // TODO: Implement actual API call for subscription update
      // For now, just update locally
      setCompanies(
        companies.map((c) =>
          c._id === companyId
            ? {
                ...c,
                subscription: {
                  ...c.subscription,
                  ...subscriptionData,
                },
              }
            : c
        )
      );
      setEditingSubscription(null);
      showNotification(t("subscriptions.updatedSuccess"));
    } catch (e) {
      showNotification(e?.message || t("subscriptions.failedToUpdate"), "error");
    }
  };

  const getAvailablePlans = () => {
    const plans = new Set();
    companies.forEach((c) => {
      if (c.subscription?.plan) {
        plans.add(c.subscription.plan);
      }
    });
    return Array.from(plans);
  };

  const filtered = companies.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = filterPlan === "all" || c.subscription?.plan === filterPlan;

    return matchesSearch && matchesPlan;
  });

  return (
    <div className="min-h-screen pt-6 pb-16">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-8 py-5 border shadow-lg animate-scale rounded-xl backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-[var(--white)] border-[var(--gray-300)]"
              : "bg-[var(--gray-900)] text-white border-[var(--gray-700)]"
          }`}
        >
          <div className="text-sm font-medium flex items-center gap-2">
            {notification.type === "success" ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="container">
        {/* Header */}
        <div className="mb-20 animate-in">
          <h1 className="text-6xl font-light mb-8 tracking-tight">{t("subscriptions.pageTitle")}</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">{t("subscriptions.pageSubtitle")}</p>
        </div>

        {/* Filters */}
        <div className="mb-12 animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 max-w-2xl">
              <input
                type="text"
                placeholder={t("companies.search")}
                className="input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--black)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <select
              className="input"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              style={{ maxWidth: "200px" }}
            >
              <option value="all">{t("subscriptions.allPlans")}</option>
              {getAvailablePlans().map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="spinner mb-6" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
            <p className="text-[var(--gray-500)] font-light">{t("common.loading")}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6 border border-[var(--gray-300)] bg-[var(--gray-50)] text-[var(--gray-700)] animate-in">
            {error}
          </div>
        )}

        {/* Companies List */}
        {!loading && !error && (
          <div className="space-y-6 animate-in" style={{ animationDelay: "0.2s" }}>
            {filtered.map((company, index) => (
              <div
                key={company._id}
                className="card border p-8 hover:border-[var(--gray-400)] transition-all"
                style={{
                  animationDelay: `${0.3 + index * 0.05}s`,
                  animation: "fadeIn 0.4s ease-out backwards",
                }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-[var(--black)] text-white flex items-center justify-center font-medium text-xl">
                        {company.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-medium mb-2">{company.name}</h3>
                        <span className={`badge ${company.status === "Active" ? "badge-success" : "badge-warning"}`}>
                          {company.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                          {t("subscriptions.currentPlan")}
                        </div>
                        <div className="text-lg font-medium text-[var(--gray-700)]">
                          {company.subscription?.plan || t("subscriptions.noPlan")}
                        </div>
                      </div>

                      {company.subscription?.startDate && (
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                            {t("payments.startDate")}
                          </div>
                          <div className="text-sm text-[var(--gray-700)] font-light">
                            {new Date(company.subscription.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      )}

                      {company.subscription?.endDate && (
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                            {t("payments.endDate")}
                          </div>
                          <div className="text-sm text-[var(--gray-700)] font-light">
                            {new Date(company.subscription.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setEditingSubscription(company)}
                      className="btn btn-primary px-8"
                    >
                      {t("subscriptions.manage")}
                    </button>
                    <button
                      onClick={() => navigate(`/companies/${company._id}`)}
                      className="btn btn-secondary px-8"
                    >
                      {t("subscriptions.viewDetails")}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-32 animate-in">
                <div className="w-20 h-20 mx-auto mb-8 border-2 border-[var(--gray-200)] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light mb-4">
                  {searchTerm || filterPlan !== "all"
                    ? t("companies.noResults")
                    : t("subscriptions.empty")}
                </h3>
                <p className="text-[var(--gray-500)] font-light">
                  {searchTerm || filterPlan !== "all"
                    ? t("subscriptions.tryAdjustFilters")
                    : t("subscriptions.willAppear")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Subscription Modal */}
      {editingSubscription && (
        <SubscriptionModal
          company={editingSubscription}
          onClose={() => setEditingSubscription(null)}
          onSave={(subscriptionData) => handleUpdateSubscription(editingSubscription._id, subscriptionData)}
        />
      )}
    </div>
  );
}

function SubscriptionModal({ company, onClose, onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    plan: company.subscription?.plan || "",
    startDate: company.subscription?.startDate
      ? new Date(company.subscription.startDate).toISOString().split("T")[0]
      : "",
    endDate: company.subscription?.endDate
      ? new Date(company.subscription.endDate).toISOString().split("T")[0]
      : "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      plan: formData.plan,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full animate-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light">{t("companyDetails.manageSubscription")}</h2>
          <button onClick={onClose} className="text-[var(--gray-400)] hover:text-[var(--black)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-[var(--gray-600)] font-light">
            {t("subscriptions.companyLabel")}{" "}
            <span className="font-medium">{company.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {t("subscriptions.plan")}
            </label>
            <select
              className="input"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              required
            >
              <option value="">{t("subscriptions.selectPlan")}</option>
              <option value="Basic">{t("subscriptions.plans.basic")}</option>
              <option value="Professional">{t("subscriptions.plans.professional")}</option>
              <option value="Enterprise">{t("subscriptions.plans.enterprise")}</option>
              <option value="Premium">{t("subscriptions.plans.premium")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {t("payments.startDate")}
            </label>
            <input
              type="date"
              className="input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {t("payments.endDate")}
            </label>
            <input
              type="date"
              className="input"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {t("subscriptions.update")}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
