import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { fetchAlerts, fetchAlertStats, markAlertAsRead } from "../api/api";
import { formatDateTime } from "../utils/formatDate.js";

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

/** Keep the top bar short — everything else goes into More. */
const PRIMARY_PATHS = ["/dashboard", "/companies", "/invoices", "/support-tickets"];

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
  const userName = storedUser?.name || t("nav.userFallback");
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
    if (alert.actionUrl) window.location.href = alert.actionUrl;
    setAlertsOpen(false);
  };

  const allLinks = useMemo(() => {
    const items = [
      { to: "/dashboard", label: t("nav.dashboard"), group: "main" },
      { to: "/analytics", label: t("nav.analytics"), group: "insights" },
      { to: "/companies", label: t("nav.companies"), group: "main" },
      { to: "/pending-companies", label: t("nav.pending"), group: "ops" },
      { to: "/subscriptions", label: t("nav.subscriptions"), group: "ops" },
      { to: "/payments", label: t("nav.payments"), group: "ops" },
      { to: "/reports", label: t("nav.reports"), group: "insights" },
      { to: "/activity", label: t("nav.activity"), group: "insights" },
      { to: "/support-tickets", label: t("nav.supportTickets"), group: "main" },
      { to: "/alerts", label: t("nav.alerts"), group: "ops" },
      { to: "/invoices", label: t("nav.invoices"), group: "main" },
      { to: "/communication", label: t("nav.communication"), group: "ops" },
    ];
    if (permissions.users !== false) {
      items.push(
        { to: "/users", label: t("nav.users"), group: "admin" },
        { to: "/user-activity", label: t("nav.userActivity"), group: "admin" },
        { to: "/sessions", label: t("nav.sessions"), group: "admin" }
      );
    }
    items.push({ to: "/settings", label: t("nav.settings"), group: "admin" });
    return items;
  }, [permissions.users, t]);

  const primaryLinks = allLinks.filter((l) => PRIMARY_PATHS.includes(l.to));
  const moreLinks = allLinks.filter((l) => !PRIMARY_PATHS.includes(l.to));
  const moreActive = moreLinks.some((l) => location.pathname.startsWith(l.to));

  const moreGroups = useMemo(() => {
    const labels = {
      insights: t("nav.groupInsights", { defaultValue: "Insights" }),
      ops: t("nav.groupOps", { defaultValue: "Operations" }),
      admin: t("nav.groupAdmin", { defaultValue: "Admin" }),
    };
    const order = ["insights", "ops", "admin"];
    return order
      .map((key) => ({
        key,
        label: labels[key],
        items: moreLinks.filter((l) => l.group === key),
      }))
      .filter((g) => g.items.length > 0);
  }, [moreLinks, t]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="top-nav">
      <nav className="top-nav-inner">
        <NavLink to={isAuthenticated ? "/dashboard" : "/"} className="brand-mark shrink-0">
          <span className="brand-mark-dot" aria-hidden />
          <span className="brand-mark-text">Nexora</span>
        </NavLink>

        {isAuthenticated && (
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center px-4">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreOpen((v) => !v);
                }}
                className={`nav-link inline-flex items-center gap-1.5 ${moreActive || moreOpen ? "is-active" : ""}`}
                aria-expanded={moreOpen}
              >
                {t("nav.more")}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {moreOpen && (
                <div className="more-panel" role="menu">
                  <div className="more-panel-grid">
                    {moreGroups.map((group) => (
                      <div key={group.key} className="more-panel-col">
                        <p className="more-panel-heading">{group.label}</p>
                        <ul className="more-panel-list">
                          {group.items.map((link) => (
                            <li key={link.to}>
                              <NavLink
                                to={link.to}
                                role="menuitem"
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) =>
                                  `more-panel-item ${isActive ? "is-active" : ""}`
                                }
                              >
                                {link.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {!isAuthenticated ? (
            <>
              <LanguageToggle />
              <NavLink to="/" className="nav-link">
                {t("nav.signIn")}
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-compact text-xs ms-1">
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
                  className="nav-icon-btn"
                  aria-label={t("nav.alerts")}
                >
                  <Bell className="w-4 h-4" />
                  {alertStats?.unread > 0 && (
                    <span className="nav-badge">
                      {alertStats.unread > 9 ? "9+" : alertStats.unread}
                    </span>
                  )}
                </button>
                {alertsOpen && (
                  <div className="alerts-panel">
                    <div className="alerts-panel-header">
                      <div className="alerts-panel-heading">
                        <span className="alerts-panel-icon" aria-hidden>
                          <Bell className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="alerts-panel-title">{t("nav.alerts")}</h3>
                        {alertStats?.unread > 0 && (
                          <span className="alerts-panel-count">{alertStats.unread}</span>
                        )}
                      </div>
                      <NavLink
                        to="/alerts"
                        onClick={() => setAlertsOpen(false)}
                        className="alerts-panel-link"
                      >
                        {t("nav.viewAll")}
                      </NavLink>
                    </div>
                    {alerts.length === 0 ? (
                      <div className="alerts-panel-empty">
                        <div className="alerts-panel-empty-icon">
                          <Bell className="w-5 h-5" />
                        </div>
                        <p className="alerts-panel-empty-title">{t("nav.noAlerts")}</p>
                        <p className="alerts-panel-empty-desc">
                          {t("empty.noAlertsDesc")}
                        </p>
                      </div>
                    ) : (
                      <div className="alerts-panel-list">
                        {alerts.map((alert) => (
                          <button
                            key={alert._id}
                            type="button"
                            onClick={() => handleAlertClick(alert)}
                            className={`alerts-panel-item ${
                              alert.status === "unread" ? "is-unread" : ""
                            }`}
                          >
                            <p className="alerts-panel-item-title">{alert.title}</p>
                            <p className="alerts-panel-item-msg">{alert.message}</p>
                            <p className="alerts-panel-item-time">
                              {formatDateTime(alert.createdAt)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="nav-user-chip" title={userName}>
                <span className="nav-avatar">{userName.charAt(0).toUpperCase()}</span>
                <span className="hidden xl:inline text-xs font-medium text-[var(--text-secondary)] max-w-[6.5rem] truncate">
                  {userName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="nav-icon-btn"
                title={t("nav.signOut")}
                aria-label={t("nav.signOut")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="lg:hidden nav-icon-btn"
          aria-label={t("nav.toggleMenu")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {alertsOpen && <div className="fixed inset-0 z-40" onClick={() => setAlertsOpen(false)} />}

      {menuOpen && (
        <div className="mobile-panel">
          {!isAuthenticated ? (
            <>
              <NavLink to="/" onClick={() => setMenuOpen(false)} className="more-panel-item">
                {t("nav.signIn")}
              </NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)} className="more-panel-item">
                {t("nav.register")}
              </NavLink>
            </>
          ) : (
            <>
              {allLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `more-panel-item ${isActive ? "is-active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--border)] px-1">
                <span className="text-xs text-[var(--text-muted)]">{userName}</span>
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                  <button type="button" onClick={handleSignOut} className="nav-icon-btn">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
