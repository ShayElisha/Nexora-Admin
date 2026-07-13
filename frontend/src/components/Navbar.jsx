import { NavLink } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import { Bell } from "lucide-react";
import { fetchAlerts, fetchAlertStats, markAlertAsRead } from "../api/api";
import { format } from "date-fns";

const defaultLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/companies", label: "Companies" },
  { to: "/pending-companies", label: "Pending" },
  { to: "/subscriptions", label: "Subscriptions" },
  { to: "/activity", label: "Activity" },
];

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export default function Navbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const storedUser = useMemo(() => parseUser(), []);
  const isAuthenticated = Boolean(storedUser);
  const userName = storedUser?.name || "User";
  const permissions = storedUser?.permissions || {};

  useEffect(() => {
    if (isAuthenticated) {
      loadAlerts();
      const interval = setInterval(loadAlerts, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadAlerts = async () => {
    try {
      const [alertsData, statsData] = await Promise.all([
        fetchAlerts({ limit: 5, status: "unread" }),
        fetchAlertStats(),
      ]);
      setAlerts(Array.isArray(alertsData) ? alertsData : alertsData?.data || []);
      setAlertStats(statsData);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  };

  const handleAlertClick = async (alert) => {
    if (alert.status === "unread") {
      try {
        await markAlertAsRead(alert._id);
        loadAlerts();
      } catch (error) {
        console.error("Failed to mark alert as read:", error);
      }
    }
    if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
    setAlertsOpen(false);
  };

  const links = useMemo(() => {
      const items = [
      { to: "/dashboard", label: t("nav.dashboard") },
      { to: "/analytics", label: t("nav.analytics") },
      { to: "/companies", label: t("nav.companies") },
      { to: "/pending-companies", label: t("nav.pending") },
      { to: "/subscriptions", label: t("nav.subscriptions") },
      { to: "/payments", label: t("nav.payments") },
      { to: "/reports", label: t("nav.reports") },
      { to: "/activity", label: t("nav.activity") },
      { to: "/support-tickets", label: t("nav.supportTickets") },
      { to: "/alerts", label: t("nav.alerts") },
      { to: "/invoices", label: t("nav.invoices") },
      { to: "/communication", label: t("nav.communication") },
    ];
    if (permissions.users !== false) {
      items.push({ to: "/users", label: t("nav.users") });
      items.push({ to: "/user-activity", label: t("nav.userActivity") || "User Activity" });
      items.push({ to: "/sessions", label: t("nav.sessions") || "Sessions" });
    }
    items.push({ to: "/settings", label: t("nav.settings") });
    return items;
  }, [permissions.users, t]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg)]/30 backdrop-blur-sm border-b border-[var(--border)]/30">
      <nav className="container">
        <div className="flex items-center justify-between h-14">
          <NavLink
            to={isAuthenticated ? "/dashboard" : "/"}
            className="text-sm font-light tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Nexora
          </NavLink>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-4">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {({ isActive }) => (
                    <span
                      className={`text-xs uppercase tracking-wider transition-colors ${
                        isActive 
                          ? "text-[var(--text-secondary)] font-normal" 
                          : "text-[var(--text-muted)] font-light hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      {link.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <LanguageToggle />
                <NavLink
                  to="/"
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {t("nav.signIn")}
                </NavLink>
                <NavLink to="/register" className="text-xs text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                  {t("nav.register")}
                </NavLink>
              </>
            ) : (
              <>
                <LanguageToggle />
                <ThemeToggle />
                {/* Alerts Bell */}
                <div className="relative">
                  <button
                    onClick={() => setAlertsOpen(!alertsOpen)}
                    className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {alertStats?.unread > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {alertStats.unread > 9 ? "9+" : alertStats.unread}
                      </span>
                    )}
                  </button>
                  {alertsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-[var(--bg)] border border-[var(--border)] shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                        <h3 className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                          {t("nav.alerts")}
                        </h3>
                        <NavLink
                          to="/alerts"
                          onClick={() => setAlertsOpen(false)}
                          className="text-xs text-[var(--primary)] hover:text-[var(--primary-dark)]"
                        >
                          {t("nav.viewAll")}
                        </NavLink>
                      </div>
                      {alerts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                          {t("nav.noAlerts")}
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border)]">
                          {alerts.map((alert) => (
                            <button
                              key={alert._id}
                              onClick={() => handleAlertClick(alert)}
                              className="w-full p-4 text-left hover:bg-[var(--bg)]/50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">
                                    {alert.title}
                                  </p>
                                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                                    {alert.message}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                    {format(
                                      new Date(alert.createdAt),
                                      "MMM d, h:mm a"
                                    )}
                                  </p>
                                </div>
                                {alert.status === "unread" && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)]">{userName}</span>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {t("nav.signOut")}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Click outside to close alerts */}
      {alertsOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setAlertsOpen(false)}
        />
      )}

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)]/30 bg-[var(--bg)]/50 backdrop-blur-sm">
          <div className="container py-4 space-y-3">
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="block text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {t("nav.signIn")}
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block text-xs text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                >
                  {t("nav.register")}
                </NavLink>
              </>
            ) : (
              <>
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="block text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/30">
                  <span className="text-xs text-[var(--text-muted)]">{userName}</span>
                  <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="block text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mt-3"
                >
                  {t("nav.signOut")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
