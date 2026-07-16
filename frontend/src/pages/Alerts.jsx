import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchAlerts,
  fetchAlertStats,
  markAlertAsRead,
  markAlertAsResolved,
  markAllAlertsAsRead,
  deleteAlert,
  runAlertChecks,
} from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import { format } from "date-fns";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageShell from "../components/ui/PageShell.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Toolbar from "../components/ui/Toolbar.jsx";
import ErrorPanel from "../components/ui/ErrorPanel.jsx";
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Eye,
  Clock,
  Calendar,
  Info,
  ExternalLink,
  Building,
  Ticket,
  User,
  Server,
} from "lucide-react";

const getPriorityColor = (priority) => {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-300";
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "low":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "unread":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "read":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "resolved":
      return "bg-green-100 text-green-700 border-green-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case "company_pending":
      return "⏳";
    case "payment_issue":
    case "payment_failed":
      return "💳";
    case "subscription_expiring":
    case "subscription_expired":
      return "⏰";
    case "at_risk_company":
      return "⚠️";
    case "high_priority_ticket":
      return "🎫";
    case "system_error":
      return "🔴";
    default:
      return "🔔";
  }
};

export default function Alerts() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [runningChecks, setRunningChecks] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());
  const alertsPerPage = 15;

  useEffect(() => {
    loadAlerts();
    loadStats();
  }, [currentPage, filterStatus, filterType, filterPriority]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: alertsPerPage,
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(filterType !== "all" && { type: filterType }),
        ...(filterPriority !== "all" && { priority: filterPriority }),
      };
      const data = await fetchAlerts(params);
      setAlerts(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      setError(e?.message || t("alerts.failedToLoad"));
      showToast(e?.message || t("alerts.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchAlertStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts(
        alerts.map((a) => (a._id === alertId ? { ...a, status: "read" } : a))
      );
      showToast(t("alerts.markedAsRead"), "success");
      loadStats();
    } catch (e) {
      showToast(e?.message || t("alerts.failedToUpdate"), "error");
    }
  };

  const handleMarkAsResolved = async (alertId) => {
    try {
      await markAlertAsResolved(alertId);
      setAlerts(
        alerts.map((a) =>
          a._id === alertId ? { ...a, status: "resolved" } : a
        )
      );
      showToast(t("alerts.markedAsResolved"), "success");
      loadStats();
    } catch (e) {
      showToast(e?.message || t("alerts.failedToUpdate"), "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAlertsAsRead();
      showToast(t("alerts.allMarkedAsRead"), "success");
      loadAlerts();
      loadStats();
    } catch (e) {
      showToast(e?.message || t("alerts.failedToUpdate"), "error");
    }
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm(t("alerts.confirmDelete"))) return;
    try {
      await deleteAlert(alertId);
      setAlerts(alerts.filter((a) => a._id !== alertId));
      showToast(t("alerts.deleted"), "success");
      loadStats();
    } catch (e) {
      showToast(e?.message || t("alerts.failedToDelete"), "error");
    }
  };

  const handleRunChecks = async () => {
    try {
      setRunningChecks(true);
      await runAlertChecks();
      showToast(t("alerts.checksCompleted"), "success");
      loadAlerts();
      loadStats();
    } catch (e) {
      showToast(e?.message || t("alerts.checksFailed"), "error");
    } finally {
      setRunningChecks(false);
    }
  };

  const handleActionClick = (alert) => {
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
      if (alert.status === "unread") {
        handleMarkAsRead(alert._id);
      }
    }
  };

  const toggleExpand = (alertId) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case "Company":
        return <Building className="w-4 h-4" />;
      case "SupportTicket":
        return <Ticket className="w-4 h-4" />;
      case "User":
        return <User className="w-4 h-4" />;
      case "System":
        return <Server className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Filter alerts by search term
  const filteredAlerts = alerts.filter((alert) => {
    const term = searchTerm.toLowerCase();
    return (
      alert.title?.toLowerCase().includes(term) ||
      alert.message?.toLowerCase().includes(term)
    );
  });

  if (loading && !alerts.length) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-28">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p className="text-[var(--text-muted)]">{t("alerts.loading")}</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={t("alerts.title")}
        subtitle={t("alerts.subtitle")}
        icon={<Bell className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={handleRunChecks}
              disabled={runningChecks}
              className="btn btn-secondary btn-compact flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${runningChecks ? "animate-spin" : ""}`} />
              {runningChecks ? t("alerts.running") : t("alerts.runChecks")}
            </button>
            <button
              onClick={handleMarkAllAsRead}
              className="btn btn-secondary btn-compact flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {t("alerts.markAllRead")}
            </button>
          </>
        }
      />

      {stats && (
        <div className="kpi-grid">
          <div className="kpi-card kpi-card-slate">
            <p className="kpi-label">{t("alerts.total")}</p>
            <p className="kpi-value">{stats.total || 0}</p>
          </div>
          <div className="kpi-card kpi-card-blue">
            <p className="kpi-label">{t("alerts.unread")}</p>
            <p className="kpi-value">{stats.unread || 0}</p>
          </div>
          <div className="kpi-card kpi-card-slate">
            <p className="kpi-label">{t("alerts.read")}</p>
            <p className="kpi-value">{stats.read || 0}</p>
          </div>
          <div className="kpi-card kpi-card-green">
            <p className="kpi-label">{t("alerts.resolved")}</p>
            <p className="kpi-value">{stats.resolved || 0}</p>
          </div>
          <div className="kpi-card kpi-card-rose">
            <p className="kpi-label">{t("alerts.critical")}</p>
            <p className="kpi-value">{stats.critical || 0}</p>
          </div>
        </div>
      )}

      <Toolbar>
        <div className="flex items-center gap-2 shrink-0 text-[var(--text-muted)]">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">{t("alerts.filters")}</span>
        </div>

        <div className="relative flex-1 min-w-[12rem] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder={t("alerts.searchPlaceholder")}
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
          <option value="all">{t("alerts.allStatus")}</option>
          <option value="unread">{t("alerts.unread")}</option>
          <option value="read">{t("alerts.read")}</option>
          <option value="resolved">{t("alerts.resolved")}</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="input !w-auto shrink-0"
        >
          <option value="all">{t("alerts.allTypes")}</option>
          <option value="company_pending">{t("alerts.type.companyPending")}</option>
          <option value="payment_issue">{t("alerts.type.paymentIssue")}</option>
          <option value="payment_failed">{t("alerts.type.paymentFailed")}</option>
          <option value="subscription_expiring">{t("alerts.type.subscriptionExpiring")}</option>
          <option value="subscription_expired">{t("alerts.type.subscriptionExpired")}</option>
          <option value="at_risk_company">{t("alerts.type.atRiskCompany")}</option>
          <option value="high_priority_ticket">{t("alerts.type.highPriorityTicket")}</option>
          <option value="system_error">{t("alerts.type.systemError")}</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => {
            setFilterPriority(e.target.value);
            setCurrentPage(1);
          }}
          className="input !w-auto shrink-0"
        >
          <option value="all">{t("alerts.allPriorities")}</option>
          <option value="critical">{t("alerts.priority.critical")}</option>
          <option value="high">{t("alerts.priority.high")}</option>
          <option value="medium">{t("alerts.priority.medium")}</option>
          <option value="low">{t("alerts.priority.low")}</option>
        </select>
      </Toolbar>

      {error ? (
        <ErrorPanel message={error} />
      ) : filteredAlerts.length === 0 ? (
        <div className="card card-elevated">
          <EmptyState
            icon={<Bell className="w-6 h-6" />}
            title={t("empty.noAlerts")}
            description={t("empty.noAlertsDesc")}
          />
        </div>
      ) : (
        <div className="list-stack">
          {filteredAlerts.map((alert) => {
            const isExpanded = expandedAlerts.has(alert._id);
            return (
              <div
                key={alert._id}
                className={`list-item ${
                  alert.status === "unread" ? "ring-1 ring-[var(--primary)]/25 bg-[var(--primary)]/[0.04]" : ""
                }`}
              >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                          {alert.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                            alert.priority
                          )}`}
                        >
                          {t(`alerts.priority.${alert.priority}`)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            alert.status
                          )}`}
                        >
                          {t(`alerts.status.${alert.status}`)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mb-3">
                        {alert.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {t("alerts.created")}: {format(new Date(alert.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                        {alert.readAt && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {t("alerts.readAt")}: {format(new Date(alert.readAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        )}
                        {alert.resolvedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t("alerts.resolvedAt")}: {format(new Date(alert.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        )}
                      </div>
                      {alert.actionUrl && (
                        <button
                          onClick={() => handleActionClick(alert)}
                          className="text-xs text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors flex items-center gap-1 mb-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {alert.actionLabel || t("alerts.view")}
                        </button>
                      )}
                      
                      {/* Expandable Details */}
                      <button
                        onClick={() => toggleExpand(alert._id)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1 mt-2"
                      >
                        <Info className="w-3 h-3" />
                        {isExpanded ? t("alerts.hideDetails") : t("alerts.showDetails")}
                      </button>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Alert Type */}
                            <div>
                              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                {t("alerts.alertType")}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {t(`alerts.type.${alert.type}`) || alert.type}
                              </p>
                            </div>

                            {/* Alert ID */}
                            <div>
                              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                {t("alerts.alertId")}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] font-mono">
                                {alert._id}
                              </p>
                            </div>

                            {/* Related Entity */}
                            {alert.relatedEntity?.entityType && (
                              <div>
                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                  {t("alerts.relatedEntity")}
                                </p>
                                <div className="flex items-center gap-2">
                                  {getEntityIcon(alert.relatedEntity.entityType)}
                                  <span className="text-xs text-[var(--text-secondary)]">
                                    {alert.relatedEntity.entityType}
                                  </span>
                                  {alert.relatedEntity.entityId && (
                                    <span className="text-xs text-[var(--text-muted)] font-mono">
                                      ({alert.relatedEntity.entityId})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Time Since Creation */}
                            <div>
                              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                                {t("alerts.timeSince")}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {(() => {
                                  const now = new Date();
                                  const created = new Date(alert.createdAt);
                                  const diffMs = now - created;
                                  const diffMins = Math.floor(diffMs / 60000);
                                  const diffHours = Math.floor(diffMs / 3600000);
                                  const diffDays = Math.floor(diffMs / 86400000);
                                  
                                  if (diffMins < 60) {
                                    return `${diffMins} ${t("alerts.minutesAgo")}`;
                                  } else if (diffHours < 24) {
                                    return `${diffHours} ${t("alerts.hoursAgo")}`;
                                  } else {
                                    return `${diffDays} ${t("alerts.daysAgo")}`;
                                  }
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Metadata */}
                          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                            <div>
                              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                {t("alerts.additionalInfo")}
                              </p>
                              <div className="bg-[var(--bg)]/50 p-3 rounded border border-[var(--border)]">
                                <div className="space-y-2">
                                  {Object.entries(alert.metadata).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-start">
                                      <span className="text-xs text-[var(--text-muted)] capitalize">
                                        {key.replace(/([A-Z])/g, " $1").trim()}:
                                      </span>
                                      <span className="text-xs text-[var(--text-secondary)] text-right ml-4">
                                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      {alert.status === "unread" && (
                        <button
                          onClick={() => handleMarkAsRead(alert._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 transition-colors rounded"
                          title={t("alerts.markAsRead")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {alert.status !== "resolved" && (
                        <button
                          onClick={() => handleMarkAsResolved(alert._id)}
                          className="p-2 text-green-600 hover:bg-green-50 transition-colors rounded"
                          title={t("alerts.markAsResolved")}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(alert._id)}
                        className="p-2 text-red-600 hover:bg-red-50 transition-colors rounded"
                        title={t("alerts.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

