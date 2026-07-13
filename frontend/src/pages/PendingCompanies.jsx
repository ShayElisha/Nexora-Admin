import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPendingCompanies, approveCompany, rejectCompany } from "../api/api";
import { useToast } from "../components/Toaster.jsx";

export default function PendingCompanies() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const data = await fetchPendingCompanies(token);
        setCompanies(data);
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (id, name) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    const prev = companies;
    setProcessingId(id);
    setCompanies((cs) => cs.filter((c) => c._id !== id));
    try {
      await approveCompany(id, token);
      showToast(`${name} approved`, "success");
    } catch (e) {
      setCompanies(prev);
      showToast(e?.message || "Failed", "error");
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
      showToast(`${name} rejected`, "success");
    } catch (e) {
      setCompanies(prev);
      showToast(e?.message || "Failed", "error");
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
    <div className="min-h-screen bg-[var(--bg)] py-8">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("pending.title")}</h1>
          <p className="text-[var(--text-secondary)]">{t("pending.subtitle")}</p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder={t("pending.search")}
            className="input max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="spinner mb-6" style={{width: '40px', height: '40px', borderWidth: '2px'}}></div>
            <p className="text-[var(--gray-500)] font-light">Loading...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6 border border-[var(--gray-300)] bg-[var(--gray-50)] text-[var(--gray-700)] animate-in">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {filtered.map((c) => (
              <div key={c._id} className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-14 h-14 bg-[var(--black)] text-white flex items-center justify-center font-medium text-xl hover-lift shimmer">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-medium mb-2">{c.name}</h3>
                        <span className="text-xs uppercase tracking-wider px-3 py-1 border border-[var(--gray-300)] bg-[var(--gray-50)]">
                          Pending Review
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Email</div>
                        <div className="text-[var(--gray-700)] font-light">{c.email}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Phone</div>
                        <div className="text-[var(--gray-700)] font-light">{c.phone}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Plan</div>
                        <div className="text-[var(--gray-700)] font-medium">{c.subscription?.plan || "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 md:flex-shrink-0">
                    <button
                      onClick={() => handleApprove(c._id, c.name)}
                      disabled={processingId === c._id}
                      className="btn btn-primary px-8"
                    >
                      {processingId === c._id ? (
                        <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.2)' }}></div>
                      ) : (
                        t("pending.approve")
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(c._id, c.name)}
                      disabled={processingId === c._id}
                      className="btn btn-secondary px-8"
                    >
                      {t("pending.reject")}
                    </button>
                  </div>
                </div>

                {/* Request Date */}
                <div className="mt-6 pt-6 border-t border-[var(--gray-200)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--gray-400)] font-light">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {t("pending.requested")} {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      }) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-32 animate-in">
                <div className="w-20 h-20 mx-auto mb-8 border-2 border-[var(--gray-200)] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light mb-4">
                  {searchTerm ? t("companies.noResults") : t("pending.allClear")}
                </h3>
                <p className="text-[var(--text-muted)] font-light">
                  {searchTerm ? t("companies.tryDifferent") : t("pending.noPending")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
