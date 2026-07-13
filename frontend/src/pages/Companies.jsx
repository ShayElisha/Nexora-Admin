import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchAllCompanies, updateCompanyStatus } from "../api/api";
import { useToast } from "../components/Toaster.jsx";

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
      if (!e.target.closest('.dropdown-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleStatusChange = async (companyId, newStatus) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    try {
      await updateCompanyStatus(companyId, newStatus, token);
      setCompanies(companies.map(c => 
        c._id === companyId ? { ...c, status: newStatus } : c
      ));
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
    <div className="min-h-screen bg-[var(--bg)] py-8">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("companies.title")}</h1>
          <p className="text-[var(--text-secondary)]">{t("companies.subtitle")}</p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder={t("companies.search")}
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
                  <div className="flex items-start justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-12 h-12 bg-[var(--black)] text-white flex items-center justify-center font-medium text-lg hover-lift shimmer">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-medium mb-1">{c.name}</h3>
                        <span className={`badge ${c.status === "Active" ? "badge-success" : "badge-warning"}`}>
                          {c.status}
                        </span>
                      </div>
                      
                      {/* Dropdown Menu */}
                      <div className="relative dropdown-menu flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/companies/${c._id}`)}
                          className="text-xs uppercase tracking-widest border border-[var(--border-color)] px-4 py-2 rounded-full hover:border-[var(--border-strong)] transition-all"
                        >
                          View Profile
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === c._id ? null : c._id);
                          }}
                          className="p-2 hover:bg-[var(--gray-100)] rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {openMenuId === c._id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden animate-scale z-10">
                            <button
                              onClick={() => handleStatusChange(c._id, "Active")}
                              disabled={c.status === "Active"}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 ${
                                c.status === "Active" ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Set Active</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(c._id, "Inactive")}
                              disabled={c.status === "Inactive"}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 border-t border-[var(--border)] ${
                                c.status === "Inactive" ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Set Inactive</span>
                            </button>
                          </div>
                        )}
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
                  
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Joined</div>
                    <div className="text-sm text-[var(--gray-600)] font-light">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      }) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-32 animate-in">
                <div className="w-20 h-20 mx-auto mb-8 border-2 border-[var(--gray-200)] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light mb-4">
                  {searchTerm ? t("companies.noResults") : t("companies.noCompanies")}
                </h3>
                <p className="text-[var(--text-muted)] font-light">
                  {searchTerm ? t("companies.tryDifferent") : t("companies.willAppear")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
