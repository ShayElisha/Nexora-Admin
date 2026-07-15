import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchAllCompanies,
  fetchPendingCompanies,
  getGeographicDistribution,
  fetchAlerts,
} from "../api/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import MetricCard from "../components/ui/MetricCard.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import InsightCard from "../components/ui/InsightCard.jsx";
import SectionCard from "../components/ui/SectionCard.jsx";

const CHART_COLORS = ["#2563eb", "#10b981", "#f97316", "#f59e0b", "#64748b"];

function BuildingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.25 9v6m-4.5-6v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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

  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem("dashboard_widgets");
    return saved
      ? JSON.parse(saved)
      : {
          stats: true,
          monthlyChart: true,
          planDistribution: true,
          geographic: true,
          alerts: true,
          recentActivity: true,
          insights: true,
        };
  });

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
        const active = companies.filter((c) => c.status === "Active").length;
        const inactive = companies.filter((c) => c.status === "Inactive").length;

        setStats({
          total: companies.length,
          active,
          inactive,
          pending: pending.length,
        });

        const monthlyData = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        companies.forEach((company) => {
          if (company.createdAt) {
            const date = new Date(company.createdAt);
            if (date >= sixMonthsAgo) {
              const monthKey = date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });
              monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
          }
        });

        setChartData(
          Object.entries(monthlyData)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => new Date(`${a.month} 1, 2024`) - new Date(`${b.month} 1, 2024`))
        );

        const planCounts = {};
        companies.forEach((company) => {
          const plan = company.subscription?.plan || "No Plan";
          planCounts[plan] = (planCounts[plan] || 0) + 1;
        });
        setPlanDistribution(
          Object.entries(planCounts).map(([name, value]) => ({ name, value }))
        );

        setRecentActivity(
          companies
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 10)
            .map((c) => ({
              id: c._id,
              name: c.name,
              action: "Registered",
              date: c.createdAt,
              status: c.status,
              plan: c.subscription?.plan || "—",
            }))
        );

        setGeographicData((Array.isArray(geoData) ? geoData : []).slice(0, 10));

        const alertsArray = Array.isArray(alertsData) ? alertsData : [];
        setImportantAlerts(
          alertsArray
            .filter(
              (alert) =>
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

  const toggleWidget = (widgetName) => {
    const next = {
      ...visibleWidgets,
      [widgetName]: !visibleWidgets[widgetName],
    };
    setVisibleWidgets(next);
    localStorage.setItem("dashboard_widgets", JSON.stringify(next));
  };

  const activeRate = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;
  const growthTrend = useMemo(() => {
    if (chartData.length < 2) return null;
    const prev = chartData[chartData.length - 2]?.count || 0;
    const curr = chartData[chartData.length - 1]?.count || 0;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }, [chartData]);

  const tooltipStyle = {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    boxShadow: "var(--shadow-md)",
    color: "var(--text-primary)",
    fontSize: "12px",
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "2px" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container max-w-7xl mx-auto space-y-10">
        <header className="animate-in">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-primary)] mb-3">
            {t("dashboard.title")}
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)]">
            {t("dashboard.subtitle")}
          </p>
        </header>

        {visibleWidgets.insights && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in">
            <InsightCard
              tone="primary"
              title="Platform health"
              description={`${activeRate.toFixed(0)}% of companies are currently active. Keep onboarding momentum healthy.`}
              icon={<span>AI</span>}
            />
            <InsightCard
              tone={stats.pending > 0 ? "warning" : "success"}
              title={stats.pending > 0 ? "Pending approvals" : "Queue is clear"}
              description={
                stats.pending > 0
                  ? `${stats.pending} companies await review. Resolve these to unlock activation.`
                  : "No pending companies in the approval queue."
              }
            />
            <InsightCard
              tone={growthTrend != null && growthTrend < 0 ? "orange" : "success"}
              title="New company growth"
              description={
                growthTrend == null
                  ? "Not enough monthly data to calculate growth yet."
                  : `Month-over-month new registrations changed by ${growthTrend.toFixed(1)}%.`
              }
            />
          </div>
        )}

        {visibleWidgets.alerts && importantAlerts.length > 0 && (
          <SectionCard
            title={t("dashboard.importantAlerts")}
            action={
              <button
                onClick={() => navigate("/alerts")}
                className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)]"
              >
                {t("dashboard.viewAllAlerts")}
              </button>
            }
            className="animate-in"
          >
            <div className="space-y-3">
              {importantAlerts.map((alert) => (
                <button
                  key={alert._id}
                  type="button"
                  onClick={() => navigate("/alerts")}
                  className="w-full text-start p-4 rounded-[var(--radius-md)] border border-[var(--border)] hover:bg-[var(--gray-50)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-[var(--text-primary)] mb-1">{alert.title}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{alert.message}</div>
                    </div>
                    <StatusBadge status={alert.priority} />
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {visibleWidgets.stats && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 animate-in"
            style={{ animationDelay: "0.05s" }}
          >
            <MetricCard
              label={t("dashboard.totalCompanies")}
              value={stats.total}
              hint={t("dashboard.allRegistered")}
              tone="blue"
              icon={<BuildingIcon />}
              trend={growthTrend}
              onDismiss={() => toggleWidget("stats")}
            />
            <MetricCard
              label={t("dashboard.active")}
              value={stats.active}
              hint={t("dashboard.currentlyActive")}
              tone="green"
              icon={<CheckIcon />}
            />
            <MetricCard
              label={t("dashboard.inactive")}
              value={stats.inactive}
              hint={t("dashboard.notActive")}
              tone="slate"
              icon={<PauseIcon />}
            />
            <MetricCard
              label={t("dashboard.pending")}
              value={stats.pending}
              hint={t("dashboard.awaitingApproval")}
              tone="orange"
              icon={<ClockIcon />}
            />
          </div>
        )}

        <div
          className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in"
          style={{ animationDelay: "0.1s" }}
        >
          {visibleWidgets.monthlyChart && (
            <SectionCard
              title={t("dashboard.newCompaniesByMonth")}
              action={
                <button
                  onClick={() => toggleWidget("monthlyChart")}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  ×
                </button>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ fill: "#2563eb", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {visibleWidgets.planDistribution && (
            <SectionCard
              title={t("dashboard.planDistribution")}
              action={
                <button
                  onClick={() => toggleWidget("planDistribution")}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  ×
                </button>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="value"
                    cornerRadius={6}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {planDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>
          )}
        </div>

        {visibleWidgets.geographic && geographicData.length > 0 && (
          <SectionCard
            title={t("dashboard.geographicDistribution")}
            className="animate-in"
            action={
              <button
                onClick={() => toggleWidget("geographic")}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                ×
              </button>
            }
          >
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={geographicData} layout="vertical" barGap={6}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="country"
                  type="category"
                  width={isRTL ? 150 : 120}
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" name={t("dashboard.totalCompanies")} radius={[0, 6, 6, 0]} />
                <Bar dataKey="active" fill="#10b981" name={t("dashboard.active")} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {visibleWidgets.recentActivity && (
          <SectionCard
            title={t("dashboard.recentActivity")}
            className="animate-in"
            action={
              <button
                onClick={() => toggleWidget("recentActivity")}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                ×
              </button>
            }
          >
            {recentActivity.length > 0 ? (
              <div className="overflow-x-auto -mx-2">
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity) => (
                      <tr
                        key={activity.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/companies/${activity.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm font-semibold">
                              {activity.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-[var(--text-primary)]">{activity.name}</div>
                              <div className="text-xs text-[var(--text-muted)]">{activity.action}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-[var(--text-secondary)]">{activity.plan}</td>
                        <td>
                          <StatusBadge status={activity.status} />
                        </td>
                        <td className="text-[var(--text-secondary)] whitespace-nowrap">
                          {activity.date
                            ? new Date(activity.date).toLocaleDateString(
                                i18n.language === "he" ? "he-IL" : "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)]">
                {t("dashboard.noRecentActivity")}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
