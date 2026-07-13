import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  fetchAllCompanies, 
  fetchPendingCompanies, 
  getGeographicDistribution,
  fetchAlerts,
} from "../api/api";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "../components/Toaster.jsx";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isRTL = i18n.language === "he";
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [geographicData, setGeographicData] = useState([]);
  const [importantAlerts, setImportantAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Widget visibility state (saved in localStorage)
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem("dashboard_widgets");
    return saved ? JSON.parse(saved) : {
      stats: true,
      monthlyChart: true,
      planDistribution: true,
      geographic: true,
      alerts: true,
      recentActivity: true,
      quickActions: true,
    };
  });

  const COLORS = ['#000000', '#525252', '#737373', '#a3a3a3', '#d4d4d4'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const [allCompanies, pendingCompanies, geoData, alertsData] = await Promise.all([
          fetchAllCompanies(token),
          fetchPendingCompanies(token),
          getGeographicDistribution(token).catch(() => []),
          fetchAlerts({ limit: 5, priority: "high" }).catch(() => []),
        ]);

        const companies = Array.isArray(allCompanies) ? allCompanies : [];
        const pending = Array.isArray(pendingCompanies) ? pendingCompanies : [];

        // Calculate stats
        const active = companies.filter((c) => c.status === "Active").length;
        const inactive = companies.filter((c) => c.status === "Inactive").length;

        setStats({
          total: companies.length,
          active,
          inactive,
          pending: pending.length,
        });

        // Prepare monthly chart data (last 6 months)
        const monthlyData = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        companies.forEach((company) => {
          if (company.createdAt) {
            const date = new Date(company.createdAt);
            if (date >= sixMonthsAgo) {
              const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
              monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
          }
        });

        const chartDataArray = Object.entries(monthlyData)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => {
            const dateA = new Date(a.month + " 1, 2024");
            const dateB = new Date(b.month + " 1, 2024");
            return dateA - dateB;
          });

        setChartData(chartDataArray);

        // Plan distribution
        const planCounts = {};
        companies.forEach((company) => {
          const plan = company.subscription?.plan || "No Plan";
          planCounts[plan] = (planCounts[plan] || 0) + 1;
        });

        const planData = Object.entries(planCounts).map(([name, value]) => ({
          name,
          value,
        }));

        setPlanDistribution(planData);

        // Recent activity (last 10 companies)
        const recent = companies
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 10)
          .map((c) => ({
            id: c._id,
            name: c.name,
            action: "Registered",
            date: c.createdAt,
            status: c.status,
          }));

        setRecentActivity(recent);

        // Set geographic data
        const geoArray = Array.isArray(geoData) ? geoData : [];
        setGeographicData(geoArray.slice(0, 10)); // Top 10 countries

        // Set important alerts (high priority and critical)
        const alertsArray = Array.isArray(alertsData) ? alertsData : [];
        setImportantAlerts(
          alertsArray
            .filter((alert) => 
              (alert.priority === "high" || alert.priority === "critical") && 
              alert.status !== "resolved"
            )
            .slice(0, 5)
        );
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save widget visibility to localStorage
  const toggleWidget = (widgetName) => {
    const newVisibility = {
      ...visibleWidgets,
      [widgetName]: !visibleWidgets[widgetName],
    };
    setVisibleWidgets(newVisibility);
    localStorage.setItem("dashboard_widgets", JSON.stringify(newVisibility));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container">
        {/* Header */}
        <div className="mb-20 animate-in">
          <div>
            <h1 className="text-6xl font-light mb-4 tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-xl text-[var(--gray-500)] font-light">{t("dashboard.subtitle")}</p>
          </div>
        </div>

        {/* Important Alerts */}
        {visibleWidgets.alerts && importantAlerts.length > 0 && (
          <div className="mb-12 animate-in" style={{ animationDelay: "0.08s" }}>
            <div className="card border p-6 bg-red-50 border-red-200">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h3 className="text-lg font-medium text-red-900">{t("dashboard.importantAlerts")}</h3>
                <button
                  onClick={() => toggleWidget("alerts")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  {t("dashboard.hide")}
                </button>
              </div>
              <div className="space-y-3">
                {importantAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="p-4 bg-white rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate("/alerts")}
                  >
                    <div className={`flex items-start justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="flex-1">
                        <div className="font-medium text-red-900 mb-1">{alert.title}</div>
                        <div className="text-sm text-red-700">{alert.message}</div>
                        <div className="text-xs text-red-500 mt-2">
                          {new Date(alert.createdAt).toLocaleDateString(i18n.language === "he" ? "he-IL" : "en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <span className={`badge ${
                        alert.priority === "critical" ? "badge-error" : "badge-warning"
                      } ${isRTL ? "mr-4" : "ml-4"}`}>
                        {alert.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/alerts")}
                className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t("dashboard.viewAllAlerts")} {isRTL ? "←" : "→"}
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {visibleWidgets.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in" style={{ animationDelay: "0.1s" }}>
            <div className="card border p-8 relative">
              <button
                onClick={() => toggleWidget("stats")}
                className={`absolute top-4 text-[var(--gray-400)] hover:text-[var(--gray-600)] text-xs ${isRTL ? "left-4" : "right-4"}`}
                title={t("dashboard.hideWidget")}
              >
                ×
              </button>
              <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-4">{t("dashboard.totalCompanies")}</div>
              <div className="text-4xl font-light mb-2">{stats.total}</div>
              <div className="text-sm text-[var(--gray-500)] font-light">{t("dashboard.allRegistered")}</div>
            </div>

            <div className="card border p-8">
              <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-4">{t("dashboard.active")}</div>
              <div className="text-4xl font-light mb-2">{stats.active}</div>
              <div className="text-sm text-[var(--gray-500)] font-light">{t("dashboard.currentlyActive")}</div>
            </div>

            <div className="card border p-8">
              <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-4">{t("dashboard.inactive")}</div>
              <div className="text-4xl font-light mb-2">{stats.inactive}</div>
              <div className="text-sm text-[var(--gray-500)] font-light">{t("dashboard.notActive")}</div>
            </div>

            <div className="card border p-8">
              <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-4">{t("dashboard.pending")}</div>
              <div className="text-4xl font-light mb-2">{stats.pending}</div>
              <div className="text-sm text-[var(--gray-500)] font-light">{t("dashboard.awaitingApproval")}</div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in" style={{ animationDelay: "0.2s" }}>
          {/* Monthly Growth Chart */}
          {visibleWidgets.monthlyChart && (
            <div className="card border p-8 relative">
              <button
                onClick={() => toggleWidget("monthlyChart")}
                className={`absolute top-4 text-[var(--gray-400)] hover:text-[var(--gray-600)] text-xs z-10 ${isRTL ? "left-4" : "right-4"}`}
                title={t("dashboard.hideWidget")}
              >
                ×
              </button>
              <h3 className="text-xl font-medium mb-6">{t("dashboard.newCompaniesByMonth")}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis dataKey="month" stroke="var(--gray-500)" style={{ fontSize: "12px" }} />
                  <YAxis stroke="var(--gray-500)" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--white)",
                      border: "1px solid var(--gray-200)",
                      borderRadius: "4px",
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--black)" strokeWidth={2} dot={{ fill: "var(--black)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Plan Distribution */}
          {visibleWidgets.planDistribution && (
            <div className="card border p-8 relative">
              <button
                onClick={() => toggleWidget("planDistribution")}
                className={`absolute top-4 text-[var(--gray-400)] hover:text-[var(--gray-600)] text-xs z-10 ${isRTL ? "left-4" : "right-4"}`}
                title={t("dashboard.hideWidget")}
              >
                ×
              </button>
              <h3 className="text-xl font-medium mb-6">{t("dashboard.planDistribution")}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Geographic Distribution */}
        {visibleWidgets.geographic && geographicData.length > 0 && (
          <div className="mb-12 animate-in" style={{ animationDelay: "0.25s" }}>
            <div className="card border p-8 relative">
              <button
                onClick={() => toggleWidget("geographic")}
                className={`absolute top-4 text-[var(--gray-400)] hover:text-[var(--gray-600)] text-xs z-10 ${isRTL ? "left-4" : "right-4"}`}
                title={t("dashboard.hideWidget")}
              >
                ×
              </button>
              <h3 className="text-xl font-medium mb-6">{t("dashboard.geographicDistribution")}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geographicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis type="number" stroke="var(--gray-500)" fontSize={12} />
                  <YAxis 
                    dataKey="country" 
                    type="category" 
                    stroke="var(--gray-500)" 
                    fontSize={12} 
                    width={isRTL ? 150 : 120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--white)",
                      border: "1px solid var(--gray-200)",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#2563eb" name={t("dashboard.totalCompanies")} />
                  <Bar dataKey="active" fill="#10b981" name={t("dashboard.active")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {visibleWidgets.recentActivity && (
          <div className="card border p-8 animate-in relative" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => toggleWidget("recentActivity")}
              className={`absolute top-4 text-[var(--gray-400)] hover:text-[var(--gray-600)] text-xs z-10 ${isRTL ? "left-4" : "right-4"}`}
              title={t("dashboard.hideWidget")}
            >
              ×
            </button>
            <h3 className="text-xl font-medium mb-6">{t("dashboard.recentActivity")}</h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className={`flex items-center justify-between py-4 border-b border-[var(--gray-100)] last:border-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="w-10 h-10 bg-[var(--black)] text-white flex items-center justify-center font-medium text-sm">
                        {activity.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{activity.name}</div>
                        <div className="text-sm text-[var(--gray-500)] font-light">{activity.action}</div>
                      </div>
                    </div>
                    <div className={isRTL ? "text-left" : "text-right"}>
                      <div className="text-sm font-light text-[var(--gray-600)]">
                        {activity.date
                          ? new Date(activity.date).toLocaleDateString(i18n.language === "he" ? "he-IL" : "en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>
                      <span className={`badge ${activity.status === "Active" ? "badge-success" : "badge-warning"} mt-2`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--gray-500)] font-light">{t("dashboard.noRecentActivity")}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
