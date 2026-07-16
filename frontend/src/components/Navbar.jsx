import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import { Bell } from "lucide-react";
import { fetchAlerts, fetchAlertStats, markAlertAsRead } from "../api/api";
import { formatDateTime } from "../utils/formatDate.js";

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const PRIMARY_PATHS = new Set([
  "/dashboard",
  "/analytics",
  "/companies",
  "/pending-companies",
  "/invoices",
  "/support-tickets",
  "/alerts",
]);

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const moreRef = useRef(null);
  const storedUser = useMemo(() => parseUser(), []);
  const isAuthenticated = Boolean(storedUser);
  const userName = storedUser?.name || "User";
  const permissions = storedUser?.permissions || {};

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    setMoreOpen(false);
    setAlertsOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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
      items.push({ to: "/user-activity", label: t("nav.userActivity") });
      items.push({ to: "/sessions", label: t("nav.sessions") });
    }
    items.push({ to: "/settings", label: t("nav.settings") });
    return items;
  }, [permissions.users, t]);

  const primaryLinks = links.filter((l) => PRIMARY_PATHS.has(l.to));
  const moreLinks = links.filter((l) => !PRIMARY_PATHS.has(l.to));
  const moreActive = moreLinks.some((l) => location.pathname.startsWith(l.to));

  const handleSignOut = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const linkClass = (isActive) =>
    `relative text-xs font-medium tracking-wide whitespace-nowrap transition-colors pb-1 ${
      isActive
        ? "text-[var(--text-primary)] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[var(--primary)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-elevated)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <nav className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 h-14">
          <NavLink
            to={isAuthenticated ? "/dashboard" : "/"}
            className="shrink-0 text-sm font-semibold tracking-[0.18em] uppercase text-[var(--text-primary)]"
          >
            Nexora
          </NavLink>

          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-4 min-w-0 flex-1 justify-center px-2">
              {primaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => linkClass(isActive)}>
                  {link.label}
                </NavLink>
              ))}

              {moreLinks.length > 0 && (
                <div className="relative" ref={moreRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoreOpen((v) => !v);
                    }}
                    className={linkClass(moreActive)}
                  >
                    {t("nav.more", { defaultValue: "More" })} ▾
                  </button>
                  {moreOpen && (
                    <div className="absolute start-0 top-full mt-3 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg py-2 z-50">
                      {moreLinks.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={() => setMoreOpen(false)}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium"
                                : "text-[var(--text-secondary)] hover:bg-[var(--gray-50)]"
                            }`
                          }
                        >
                          {link.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {!isAuthenticated ? (
              <>
                <LanguageToggle />
                <NavLink
                  to="/"
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t("nav.signIn")}
                </NavLink>
                <NavLink
                  to="/register"
                  className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                >
                  {t("nav.register")}
                </NavLink>
              </>
            ) : (
              <>
                <LanguageToggle />
                <ThemeToggle />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAlertsOpen(!alertsOpen)}
                    className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--gray-50)] transition-colors"
                    aria-label={t("nav.alerts")}
                  >
                    <Bell className="w-4 h-4" />
                    {alertStats?.unread > 0 && (
                      <span className="absolute top-1 end-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {alertStats.unread > 9 ? "9+" : alertStats.unread}
                      </span>
                    )}
                  </button>
                  {alertsOpen && (
                    <div className="absolute end-0 mt-2 w-80 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
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
                        <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                          {t("nav.noAlerts")}
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border)]">
                          {alerts.map((alert) => (
                            <button
                              key={alert._id}
                              type="button"
                              onClick={() => handleAlertClick(alert)}
                              className="w-full p-4 text-start hover:bg-[var(--gray-50)] transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[var(--text-primary)] mb-1">
                                    {alert.title}
                                  </p>
                                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                                    {alert.message}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                    {formatDateTime(alert.createdAt)}
                                  </p>
                                </div>
                                {alert.status === "unread" && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)] max-w-[8rem] truncate">
                  {userName}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t("nav.signOut")}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--gray-50)] transition-colors"
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

      {alertsOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setAlertsOpen(false)} />
      )}

      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="container max-w-7xl mx-auto py-4 space-y-1">
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--gray-50)]"
                >
                  {t("nav.signIn")}
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-[var(--primary)]"
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
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--gray-50)]"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--border)] px-3">
                  <span className="text-xs text-[var(--text-muted)]">{userName}</span>
                  <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full text-start px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--gray-50)] mt-1"
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
