import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchAllCompanies, updateCompanyStatus } from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import SectionCard from "../components/ui/SectionCard.jsx";

export default function Companies() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const data = await fetchAllCompanies(token);
        setCompanies(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || "Failed to load companies");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-menu")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleStatusChange = async (companyId, newStatus) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    try {
      await updateCompanyStatus(companyId, newStatus, token);
      setCompanies(
        companies.map((c) => (c._id === companyId ? { ...c, status: newStatus } : c))
      );
      showToast(`Status updated to ${newStatus}`, "success");
      setOpenMenuId(null);
    } catch (e) {
      showToast(e?.message || "Failed to update status", "error");
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-7xl mx-auto space-y-8">
        <header className="animate-in">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">
            {t("companies.title")}
          </h1>
          <p className="text-[var(--text-secondary)]">{t("companies.subtitle")}</p>
        </header>

        <div className="animate-in" style={{ animationDelay: "0.05s" }}>
          <input
            type="text"
            placeholder={t("companies.search")}
            className="input max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="spinner mb-6" style={{ width: "40px", height: "40px", borderWidth: "2px" }} />
            <p className="text-[var(--text-muted)]">Loading...</p>
          </div>
        )}

        {error && (
          <div className="card border border-[var(--error)]/20 bg-[rgba(239,68,68,0.06)] text-[var(--error)]">
            {error}
          </div>
        )}

        {!loading && !error && (
          <SectionCard className="animate-in" bodyClassName="overflow-x-auto -mx-2">
            {filtered.length > 0 ? (
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{c.name}</div>
                            <div className="text-xs text-[var(--text-muted)] truncate max-w-[180px]">
                              {c._id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-[var(--text-primary)]">{c.email || "—"}</div>
                        <div className="text-xs text-[var(--text-muted)]">{c.phone || "—"}</div>
                      </td>
                      <td className="text-[var(--text-secondary)] font-medium">
                        {c.subscription?.plan || "—"}
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="text-[var(--text-secondary)] whitespace-nowrap">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <div className="relative dropdown-menu flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/companies/${c._id}`)}
                            className="text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--gray-50)] transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === c._id ? null : c._id);
                            }}
                            className="p-2 rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                            aria-label="More actions"
                          >
                            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {openMenuId === c._id && (
                            <div className="absolute end-0 top-full mt-2 w-44 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-lg overflow-hidden animate-scale z-10">
                              <button
                                onClick={() => handleStatusChange(c._id, "Active")}
                                disabled={c.status === "Active"}
                                className={`w-full px-4 py-2.5 text-start text-sm hover:bg-[var(--gray-50)] ${
                                  c.status === "Active" ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                Set Active
                              </button>
                              <button
                                onClick={() => handleStatusChange(c._id, "Inactive")}
                                disabled={c.status === "Inactive"}
                                className={`w-full px-4 py-2.5 text-start text-sm hover:bg-[var(--gray-50)] border-t border-[var(--border)] ${
                                  c.status === "Inactive" ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                Set Inactive
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20 text-[var(--text-muted)]">
                {t("companies.noCompanies") || "No companies found"}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
