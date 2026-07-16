import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchSupportTickets, updateSupportTicketStatus } from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import { format } from "date-fns";
import { Ticket, Search, Filter, MessageSquare, User, Calendar, Building } from "lucide-react";
import EmptyState from "../components/ui/EmptyState.jsx";

const getStatusColor = (status) => {
  switch (status) {
    case "Open":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Resolved":
      return "bg-green-100 text-green-700 border-green-300";
    case "Closed":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "Urgent":
      return "text-red-600 font-bold";
    case "High":
      return "text-orange-600 font-semibold";
    case "Medium":
      return "text-yellow-600";
    case "Low":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "Bug Report":
      return "🐛";
    case "Feature Request":
      return "✨";
    case "Technical Support":
      return "🔧";
    case "Billing":
      return "💳";
    case "General Question":
      return "❓";
    case "Account Issue":
      return "👤";
    default:
      return "📋";
  }
};

export default function SupportTickets() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 15;
  
  const isRTL = i18n.language === "he";

  useEffect(() => {
    const load = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const data = await fetchSupportTickets(token);
        setTickets(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || t("supportTickets.failedToLoad"));
        showToast(e?.message || t("supportTickets.failedToLoad"), "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const handleStatusChange = async (ticketId, newStatus) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    try {
      await updateSupportTicketStatus(ticketId, newStatus, token);
      setTickets(
        tickets.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
      );
      showToast(t("supportTickets.statusUpdated", { status: newStatus }), "success");
    } catch (e) {
      showToast(e?.message || t("supportTickets.failedToUpdate"), "error");
    }
  };

  // Get unique companies for filter
  const companies = [...new Set(tickets.map((t) => t.companyId?.name).filter(Boolean))];

  // Filtering
  let filtered = tickets.filter((ticket) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      ticket.title?.toLowerCase().includes(term) ||
      ticket.description?.toLowerCase().includes(term) ||
      ticket.category?.toLowerCase().includes(term) ||
      ticket.companyId?.name?.toLowerCase().includes(term) ||
      ticket.createdBy?.name?.toLowerCase().includes(term);

    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || ticket.category === filterCategory;
    const matchesCompany =
      filterCompany === "all" || ticket.companyId?.name === filterCompany;

    return matchesSearch && matchesStatus && matchesCategory && matchesCompany;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ticketsPerPage);
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filtered.slice(indexOfFirstTicket, indexOfLastTicket);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
    closed: tickets.filter((t) => t.status === "Closed").length,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container space-y-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("supportTickets.title")}</h1>
          <p className="text-[var(--text-secondary)]">{t("supportTickets.subtitle")}</p>
        </header>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="kpi-card kpi-card-slate">
            <p className="kpi-label">{t("supportTickets.total")}</p>
            <p className="kpi-value">{stats.total}</p>
          </div>
          <div className="kpi-card kpi-card-amber">
            <p className="kpi-label">{t("supportTickets.open")}</p>
            <p className="kpi-value">{stats.open}</p>
          </div>
          <div className="kpi-card kpi-card-blue">
            <p className="kpi-label">{t("supportTickets.inProgress")}</p>
            <p className="kpi-value">{stats.inProgress}</p>
          </div>
          <div className="kpi-card kpi-card-green">
            <p className="kpi-label">{t("supportTickets.resolved")}</p>
            <p className="kpi-value">{stats.resolved}</p>
          </div>
          <div className="kpi-card kpi-card-rose">
            <p className="kpi-label">{t("supportTickets.closed")}</p>
            <p className="kpi-value">{stats.closed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card card-elevated p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">{t("supportTickets.filters")}</span>
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--text-muted)]"
                size={18}
              />
              <input
                type="text"
                placeholder={t("supportTickets.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input ps-10"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-auto min-w-[9rem]"
            >
              <option value="all">{t("supportTickets.allStatus")}</option>
              <option value="Open">{t("supportTickets.open")}</option>
              <option value="In Progress">{t("supportTickets.inProgress")}</option>
              <option value="Resolved">{t("supportTickets.resolved")}</option>
              <option value="Closed">{t("supportTickets.closed")}</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-auto min-w-[10rem]"
            >
              <option value="all">{t("supportTickets.allCategories")}</option>
              <option value="Bug Report">{t("supportTickets.categories.Bug Report")}</option>
              <option value="Feature Request">{t("supportTickets.categories.Feature Request")}</option>
              <option value="Technical Support">{t("supportTickets.categories.Technical Support")}</option>
              <option value="Billing">{t("supportTickets.categories.Billing")}</option>
              <option value="General Question">{t("supportTickets.categories.General Question")}</option>
              <option value="Account Issue">{t("supportTickets.categories.Account Issue")}</option>
            </select>

            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="input w-auto min-w-[10rem]"
            >
              <option value="all">{t("supportTickets.allCompanies")}</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)] py-8">
            <div className="spinner" />
            {t("supportTickets.loading")}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6 border border-[var(--gray-300)] bg-[var(--gray-50)] text-[var(--gray-700)]">
            {error}
          </div>
        )}

        {/* Tickets List */}
        {!loading && !error && (
          <div className="space-y-4">
            {currentTickets.length === 0 ? (
              <div className="card card-elevated">
                <EmptyState
                  icon={<Ticket size={28} />}
                  title={t("supportTickets.noTickets")}
                  description={t("empty.description")}
                />
              </div>
            ) : (
              currentTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="card cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    navigate(`/support-tickets/${ticket._id}`);
                  }}
                >
                  <div className={`flex items-start justify-between gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-1">
                      <div className={`flex items-center gap-3 mb-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-2xl">{getCategoryIcon(ticket.category)}</span>
                        <h3 className="text-lg font-bold flex-1">{ticket.title}</h3>
                        <span className="text-sm text-[var(--text-muted)]">
                          {t(`supportTickets.categories.${ticket.category}`) || ticket.category}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {(() => {
                            const statusKey = ticket.status === "Open" ? "open" 
                              : ticket.status === "In Progress" ? "inProgress" 
                              : ticket.status.toLowerCase();
                            return t(`supportTickets.${statusKey}`) || ticket.status;
                          })()}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}
                        >
                          {t(`supportTickets.priorities.${ticket.priority}`) || ticket.priority}
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className={`flex items-center gap-6 text-sm text-[var(--text-muted)] flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <User size={16} />
                          <span>{ticket.createdBy?.name || t("supportTickets.unknown")}</span>
                        </span>
                        <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Calendar size={16} />
                          <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                        </span>
                        {ticket.comments?.length > 0 && (
                          <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <MessageSquare size={16} />
                            <span>{ticket.comments.length} {t("supportTickets.comments")}</span>
                          </span>
                        )}
                        {ticket.companyId?.name && (
                          <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Building size={16} />
                            {ticket.companyId.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <select
                        value={ticket.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(ticket._id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="input text-sm"
                      >
                        <option value="Open">{t("supportTickets.open")}</option>
                        <option value="In Progress">{t("supportTickets.inProgress")}</option>
                        <option value="Resolved">{t("supportTickets.resolved")}</option>
                        <option value="Closed">{t("supportTickets.closed")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex justify-center items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              {t("supportTickets.previous")}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`btn ${currentPage === page ? "btn-primary" : "btn-secondary"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
            >
              {t("supportTickets.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
