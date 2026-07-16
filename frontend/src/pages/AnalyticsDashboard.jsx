import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";
import {
  getMRR,
  getARR,
  getChurnRate,
  getCLV,
  getRevenueTrends,
  getCohortAnalysis,
  getCompanyPerformance,
  getAtRiskCompanies,
  getGeographicDistribution,
  getComprehensiveAnalytics,
} from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import InsightCard from "../components/ui/InsightCard.jsx";
import PageShell from "../components/ui/PageShell.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import ErrorPanel from "../components/ui/ErrorPanel.jsx";
import { BarChart3 } from "lucide-react";

const chartColors = [
  "#2563eb",
  "#10b981",
  "#f97316",
  "#f59e0b",
  "#0ea5e9",
  "#64748b",
  "#f59e0b",
  "#ef4444",
];

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  // State for KPI metrics
  const [kpiData, setKpiData] = useState({
    mrr: 0,
    arr: 0,
    churnRate: 0,
    clv: 0,
    arpu: 0,
    growthRate: 0,
    conversionRate: 0,
    totalCompanies: 0,
    activeCompanies: 0,
  });

  // State for charts
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [cohortData, setCohortData] = useState([]);
  const [geographicData, setGeographicData] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [atRiskCompanies, setAtRiskCompanies] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState(0);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Company Performance filters
  const [sortBy, setSortBy] = useState("totalRevenue");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, sortBy, filterPlan, filterIndustry]);

  const getToken = () => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.token;
    } catch {
      return null;
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");
    const token = getToken();

    try {
      // Load all analytics in parallel
      const [
        comprehensive,
        mrrData,
        arrData,
        churnData,
        clvData,
        trendsData,
        cohortDataRes,
        performanceData,
        atRiskData,
        geoData,
      ] = await Promise.all([
        getComprehensiveAnalytics(token),
        getMRR(token),
        getARR(token),
        getChurnRate(token, selectedPeriod),
        getCLV(token),
        getRevenueTrends(token, 12),
        getCohortAnalysis(token),
        getCompanyPerformance(token, sortBy, filterPlan !== "all" ? filterPlan : undefined, filterIndustry !== "all" ? filterIndustry : undefined),
        getAtRiskCompanies(token),
        getGeographicDistribution(token),
      ]);

      // Set KPI data
      setKpiData({
        mrr: comprehensive?.mrr || mrrData?.mrr || 0,
        arr: comprehensive?.arr || arrData?.arr || 0,
        churnRate: churnData?.churnRate || 0,
        clv: clvData?.averageCLV || 0,
        arpu: comprehensive?.arpu || 0,
        growthRate: comprehensive?.growthRate || 0,
        conversionRate: comprehensive?.conversionRate || 0,
        totalCompanies: comprehensive?.totalCompanies || 0,
        activeCompanies: comprehensive?.activeCompanies || 0,
      });

      setPendingCompanies(comprehensive?.pendingCompanies || 0);

      // Set chart data
      setRevenueTrends(trendsData || []);
      setCohortData(cohortDataRes || []);
      setGeographicData(geoData || []);
      
      // Ensure all company data has required fields with defaults
      const normalizedPerformance = (performanceData || []).map((company) => ({
        ...company,
        healthStatus: company.healthStatus || "healthy",
        performanceScore: company.performanceScore ?? 50,
        growthRate: company.growthRate ?? 0,
        revenueTrend: company.revenueTrend || "stable",
        monthsActive: company.monthsActive || 0,
        mrr: company.mrr || 0,
        totalRevenue: company.totalRevenue || 0,
      }));
      setTopCompanies(normalizedPerformance);
      setAtRiskCompanies(atRiskData || []);
    } catch (err) {
      setError(err?.message || t("analytics.failedToLoad"));
      showToast(err?.message || t("analytics.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const KPICard = ({ title, value, subtitle, trend, tone = "slate" }) => {
    const toneClass = {
      slate: "kpi-card-slate",
      green: "kpi-card-green",
      blue: "kpi-card-blue",
      amber: "kpi-card-amber",
      rose: "kpi-card-rose",
    }[tone] || "kpi-card-slate";

    return (
      <div className={`kpi-card ${toneClass}`}>
        <p className="kpi-label">{title}</p>
        <p className="kpi-value">{value}</p>
        {subtitle && (
          <p className="text-xs opacity-75 mt-1.5 font-medium">{subtitle}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-sm font-semibold ${trend >= 0 ? "text-teal-700" : "text-rose-600"}`}>
              {formatPercentage(trend)}
            </span>
            <span className="text-xs opacity-70">{t("analytics.vsLastPeriod")}</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-28">
          <div className="spinner mb-4" />
          <p className="text-[var(--text-secondary)]">{t("analytics.loading")}</p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorPanel message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell>
        <PageHeader
          title={t("analytics.title")}
          subtitle={t("analytics.subtitle")}
          icon={<BarChart3 className="w-5 h-5" />}
          actions={
            <select
              className="input !w-auto"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="month">{t("analytics.period.month")}</option>
              <option value="quarter">{t("analytics.period.quarter")}</option>
              <option value="year">{t("analytics.period.year")}</option>
            </select>
          }
        />

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title={t("analytics.kpi.mrr")}
            value={formatCurrency(kpiData.mrr)}
            subtitle={t("analytics.kpi.mrrSubtitle")}
            tone="green"
            trend={kpiData.growthRate}
          />
          <KPICard
            title={t("analytics.kpi.arr")}
            value={formatCurrency(kpiData.arr)}
            subtitle={t("analytics.kpi.arrSubtitle")}
            tone="blue"
          />
          <KPICard
            title={t("analytics.kpi.churnRate")}
            value={`${kpiData.churnRate.toFixed(2)}%`}
            subtitle={t(`analytics.period.${selectedPeriod}`)}
            tone="rose"
          />
          <KPICard
            title={t("analytics.kpi.clv")}
            value={formatCurrency(kpiData.clv)}
            subtitle={t("analytics.kpi.clvSubtitle")}
            tone="slate"
          />
          <KPICard
            title={t("analytics.kpi.arpu")}
            value={formatCurrency(kpiData.arpu)}
            subtitle={t("analytics.kpi.arpuSubtitle")}
            tone="amber"
          />
          <KPICard
            title={t("analytics.kpi.growthRate")}
            value={formatPercentage(kpiData.growthRate)}
            subtitle={t("analytics.kpi.growthRateSubtitle")}
            tone="green"
          />
          <KPICard
            title={t("analytics.kpi.conversionRate")}
            value={`${kpiData.conversionRate.toFixed(2)}%`}
            subtitle={t("analytics.kpi.conversionRateSubtitle")}
            tone="blue"
          />
          <KPICard
            title={t("analytics.kpi.activeCompanies")}
            value={kpiData.activeCompanies}
            subtitle={t("analytics.kpi.activeCompaniesSubtitle", { total: kpiData.totalCompanies })}
            tone="slate"
          />
        </section>

        {/* Revenue Trends Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card card-elevated">
            <h2 className="text-xl font-semibold mb-4">{t("analytics.charts.revenueTrends")}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrends}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f766e"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                    name={t("analytics.charts.revenue")}
                  />
                  <Line
                    type="monotone"
                    dataKey="newCompanies"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    name={t("analytics.charts.newCompanies")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cohort Analysis */}
          <div className="card card-elevated">
            <h2 className="text-xl font-semibold mb-4">{t("analytics.charts.cohortAnalysis")}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="cohort" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="active" fill="#0f766e" name={t("analytics.charts.active")} />
                  <Bar dataKey="inactive" fill="#ef4444" name={t("analytics.charts.inactive")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Company Performance Table */}
        <section className="card card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{t("analytics.performance.title")}</h2>
            <button
              onClick={() => setShowChart(!showChart)}
              className="btn btn-secondary text-sm"
            >
              {showChart ? t("analytics.performance.hideChart") : t("analytics.performance.showChart")}
            </button>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder={t("analytics.performance.search")}
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="totalRevenue">{t("analytics.performance.sortBy.totalRevenue")}</option>
              <option value="mrr">{t("analytics.performance.sortBy.mrr")}</option>
              <option value="monthsActive">{t("analytics.performance.sortBy.monthsActive")}</option>
              <option value="growthRate">{t("analytics.performance.sortBy.growthRate")}</option>
              <option value="performanceScore">{t("analytics.performance.sortBy.performanceScore")}</option>
              <option value="name">{t("analytics.performance.sortBy.name")}</option>
            </select>
            <select
              className="input"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="all">{t("analytics.performance.filter.allPlans")}</option>
              <option value="Basic">{t("analytics.performance.filter.basic")}</option>
              <option value="Pro">{t("analytics.performance.filter.pro")}</option>
              <option value="Enterprise">{t("analytics.performance.filter.enterprise")}</option>
            </select>
            <select
              className="input"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
            >
              <option value="all">{t("analytics.performance.filter.allIndustries")}</option>
              <option value="Technology">Technology</option>
              <option value="Retail">Retail</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
            </select>
          </div>

          {/* Bar Chart Visualization */}
          {showChart && topCompanies.length > 0 && (
            <div className="mb-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCompanies.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="mrr" fill="#2563eb" name={t("analytics.charts.revenue")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Performance Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.rank")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.company")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.plan")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.mrr")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.totalRevenue")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.growth")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.months")}
                  </th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.health")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.score")}
                  </th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("analytics.performance.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCompanies
                  .filter((company) =>
                    searchTerm === "" ||
                    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((company, idx) => {
                    const healthColors = {
                      healthy: "bg-green-100 text-green-800 border-green-200",
                      "at-risk": "bg-yellow-100 text-yellow-800 border-yellow-200",
                      critical: "bg-red-100 text-red-800 border-red-200",
                    };
                    const healthStatus = company.healthStatus || "healthy";
                    const performanceScore = company.performanceScore || 0;
                    const growthRate = company.growthRate || 0;
                    const revenueTrend = company.revenueTrend || "stable";
                    const trendIcon = revenueTrend === "growing" ? "↑" : revenueTrend === "declining" ? "↓" : "→";
                    const trendColor = revenueTrend === "growing" ? "text-green-600" : revenueTrend === "declining" ? "text-red-600" : "text-gray-600";

                      return (
                      <tr
                        key={company.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/companies/${company.id}`}
                      >
                        <td className="py-4 px-4">
                          <div className="w-8 h-8 bg-[var(--primary)] text-white flex items-center justify-center font-bold rounded-full text-sm">
                            {idx + 1}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-[var(--text)]">{company.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{company.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="badge badge-secondary">{company.plan}</span>
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-[var(--text)]">
                          {formatCurrency(company.mrr)}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-[var(--text)]">
                          {formatCurrency(company.totalRevenue)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-medium ${trendColor}`}>
                            {trendIcon} {formatPercentage(growthRate)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-sm text-[var(--text-secondary)]">
                          {company.monthsActive || 0}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${healthColors[healthStatus] || healthColors.healthy}`}>
                            {t(`analytics.performance.health.${healthStatus}`)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  performanceScore >= 70
                                    ? "bg-green-500"
                                    : performanceScore >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, performanceScore))}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-[var(--text)] w-8 text-right">
                              {performanceScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/companies/${company.id}`;
                            }}
                            className="text-xs text-[var(--primary)] hover:underline"
                          >
                            {t("analytics.performance.table.view")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {topCompanies.filter((company) =>
              searchTerm === "" ||
              company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              company.email?.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                {t("analytics.widgets.noData")}
              </p>
            )}
          </div>
        </section>

        {/* At-Risk Companies */}
        <section className="card card-elevated">
          <h2 className="text-xl font-semibold mb-4">{t("analytics.widgets.atRiskCompanies")}</h2>
            <div className="space-y-3">
              {atRiskCompanies.length > 0 ? (
                atRiskCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text)]">{company.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {company.email}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {t("analytics.widgets.riskScore")}: {company.riskScore}% • {company.paymentStatus}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-warning">{company.plan}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  {t("analytics.widgets.noAtRisk")}
                </p>
              )}
            </div>
        </section>

        {/* Geographic Distribution */}
        <section className="card card-elevated">
          <h2 className="text-xl font-semibold mb-4">{t("analytics.charts.geographicDistribution")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geographicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="country" type="category" stroke="#64748b" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" name={t("analytics.charts.totalCompanies")} />
                <Bar dataKey="active" fill="#0f766e" name={t("analytics.charts.active")} />
                <Bar dataKey="revenue" fill="#f59e0b" name={t("analytics.charts.revenue")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* AI Insights & Recommendations */}
        <section className="card card-elevated p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="metric-icon metric-icon-blue text-xs font-semibold">AI</div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {t("analytics.insights.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
                {t("analytics.insights.keyInsights")}
              </h3>
              {kpiData.churnRate > 5 && (
                <InsightCard
                  tone="danger"
                  title={t("analytics.insights.highChurn.title")}
                  description={t("analytics.insights.highChurn.message", {
                    rate: kpiData.churnRate.toFixed(2),
                  })}
                />
              )}
              {kpiData.growthRate < 0 && (
                <InsightCard
                  tone="orange"
                  title={t("analytics.insights.negativeGrowth.title")}
                  description={t("analytics.insights.negativeGrowth.message")}
                />
              )}
              {kpiData.conversionRate < 30 && (
                <InsightCard
                  tone="warning"
                  title={t("analytics.insights.lowConversion.title")}
                  description={t("analytics.insights.lowConversion.message", {
                    rate: kpiData.conversionRate.toFixed(2),
                  })}
                />
              )}
              {atRiskCompanies.length > 0 && (
                <InsightCard
                  tone="danger"
                  title={t("analytics.insights.atRisk.title", { count: atRiskCompanies.length })}
                  description={t("analytics.insights.atRisk.message", {
                    count: atRiskCompanies.length,
                  })}
                />
              )}
              {kpiData.growthRate > 10 && kpiData.churnRate < 3 && (
                <InsightCard
                  tone="success"
                  title={t("analytics.insights.healthyGrowth.title")}
                  description={t("analytics.insights.healthyGrowth.message")}
                />
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
                {t("analytics.insights.recommendations")}
              </h3>
              <InsightCard
                tone="primary"
                title={t("analytics.insights.focusTopPerformers.title")}
                description={t("analytics.insights.focusTopPerformers.message", {
                  count: Math.min(3, topCompanies.length),
                })}
              />
              {kpiData.arpu < 200 && (
                <InsightCard
                  tone="primary"
                  title={t("analytics.insights.increaseARPU.title")}
                  description={t("analytics.insights.increaseARPU.message", {
                    arpu: kpiData.arpu.toFixed(2),
                  })}
                />
              )}
              {pendingCompanies > 0 && (
                <InsightCard
                  tone="warning"
                  title={t("analytics.insights.reviewPending.title")}
                  description={t("analytics.insights.reviewPending.message", {
                    count: pendingCompanies,
                  })}
                />
              )}
              <InsightCard
                tone="success"
                title={t("analytics.insights.revenueForecast.title")}
                description={t("analytics.insights.revenueForecast.message", {
                  forecast: formatCurrency(kpiData.arr * (1 + kpiData.growthRate / 100)),
                })}
              />
            </div>
          </div>
        </section>
    </PageShell>
  );
}

