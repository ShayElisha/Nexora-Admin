import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPendingCompanies, approveCompany, rejectCompany } from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import PageShell from "../components/ui/PageShell.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Toolbar from "../components/ui/Toolbar.jsx";
import ErrorPanel from "../components/ui/ErrorPanel.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { ClipboardCheck, Search } from "lucide-react";

export default function PendingCompanies() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const data = await fetchPendingCompanies(token);
      setCompanies(data);
    } catch (e) {
      setError(e?.message || t("pending.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id, name) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    const prev = companies;
    setProcessingId(id);
    setCompanies((cs) => cs.filter((c) => c._id !== id));
    try {
      await approveCompany(id, token);
      showToast(t("pending.approved", { name }), "success");
    } catch (e) {
      setCompanies(prev);
      showToast(e?.message || t("pending.failed"), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, name) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    const prev = companies;
    setProcessingId(id);
    setCompanies((cs) => cs.filter((c) => c._id !== id));
    try {
      await rejectCompany(id, token);
      showToast(t("pending.rejected", { name }), "success");
    } catch (e) {
      setCompanies(prev);
      showToast(e?.message || t("pending.failed"), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader
        title={t("pending.title")}
        subtitle={t("pending.subtitle")}
        icon={<ClipboardCheck className="w-5 h-5" />}
      />

      <Toolbar>
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder={t("pending.search")}
            className="input ps-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Toolbar>

      {loading && (
        <div className="flex flex-col items-center justify-center py-28">
          <div className="spinner mb-6" style={{ width: "40px", height: "40px", borderWidth: "2px" }} />
          <p className="text-[var(--text-muted)]">{t("common.loading")}</p>
        </div>
      )}

      {error && <ErrorPanel message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="list-stack">
          {filtered.map((c) => (
            <div key={c._id} className="list-item">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center font-semibold text-lg shrink-0">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1.5">
                        {c.name}
                      </h3>
                      <span className="soft-badge bg-amber-50 text-amber-800 border-amber-200">
                        {t("pending.pendingReview")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        {t("companies.email")}
                      </div>
                      <div className="text-[var(--text-secondary)]">{c.email || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        {t("companies.phone")}
                      </div>
                      <div className="text-[var(--text-secondary)]">{c.phone || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        {t("companies.plan")}
                      </div>
                      <div className="text-[var(--text-primary)] font-medium">
                        {c.subscription?.plan || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                  <button
                    onClick={() => handleApprove(c._id, c.name)}
                    disabled={processingId === c._id}
                    className="btn btn-primary px-7"
                  >
                    {processingId === c._id ? (
                      <div
                        className="spinner"
                        style={{
                          borderTopColor: "white",
                          borderColor: "rgba(255,255,255,0.2)",
                        }}
                      />
                    ) : (
                      t("pending.approve")
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(c._id, c.name)}
                    disabled={processingId === c._id}
                    className="btn btn-secondary px-7"
                  >
                    {t("pending.reject")}
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                {t("pending.requested")}{" "}
                {c.createdAt
                  ? new Date(c.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card card-elevated">
              <EmptyState
                icon={<ClipboardCheck className="w-6 h-6" />}
                title={searchTerm ? t("companies.noResults") : t("pending.allClear")}
                description={
                  searchTerm ? t("companies.tryDifferent") : t("pending.noPending")
                }
              />
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
