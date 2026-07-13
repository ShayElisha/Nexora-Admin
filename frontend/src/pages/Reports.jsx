import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/Toaster.jsx";
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
import { fetchAllCompanies, fetchCompanyStatistics } from "../api/api";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function Reports() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("revenue");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [revenueData, setRevenueData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [usageData, setUsageData] = useState([]);

  useEffect(() => {
    loadReportData();
  }, [dateRange, reportType]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const companies = await fetchAllCompanies(token);
      const stats = await fetchCompanyStatistics(token);

      // Generate revenue data (monthly)
      const monthlyRevenue = generateMonthlyRevenue(companies);
      setRevenueData(monthlyRevenue);

      // Generate growth data
      const growth = generateGrowthData(companies);
      setGrowthData(growth);

      // Generate plan distribution
      const distribution = generatePlanDistribution(companies);
      setPlanDistribution(distribution);

      // Generate usage data
      const usage = generateUsageData(companies);
      setUsageData(usage);
    } catch (err) {
      showToast(err?.message || "Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyRevenue = (companies) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString("default", { month: "short" });
      const revenue = companies.reduce((sum, company) => {
        if (company.subscription?.plan) {
          const prices = { Basic: 199, Pro: 399, Enterprise: 599 };
          return sum + (prices[company.subscription.plan] || 0);
        }
        return sum;
      }, 0);
      months.push({ month: monthName, revenue });
    }
    return months;
  };

  const generateGrowthData = (companies) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString("default", { month: "short" });
      // Simulate growth data
      const newCompanies = Math.floor(Math.random() * 10) + 5;
      months.push({ month: monthName, newCompanies, total: newCompanies * 10 });
    }
    return months;
  };

  const generatePlanDistribution = (companies) => {
    const distribution = { Basic: 0, Pro: 0, Enterprise: 0, Free: 0 };
    companies.forEach((company) => {
      const plan = company.subscription?.plan || "Free";
      distribution[plan] = (distribution[plan] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const generateUsageData = (companies) => {
    return [
      { category: "Active Users", count: companies.filter((c) => c.status === "Active").length },
      { category: "Pending", count: companies.filter((c) => c.status === "Pending").length },
      { category: "Inactive", count: companies.filter((c) => c.status === "Inactive").length },
    ];
  };

  const handleExport = (format) => {
    showToast(`${format} export coming soon`, "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8">
      <div className="container">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("reports.title")}</h1>
            <p className="text-[var(--text-secondary)]">
              {t("reports.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => handleExport("PDF")}
            >
              {t("reports.exportPDF")}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleExport("Excel")}
            >
              {t("reports.exportExcel")}
            </button>
          </div>
        </header>

        {/* Date Range Filter */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">
                {t("reports.startDate")}
              </label>
              <input
                type="date"
                className="input w-full"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-2">
                {t("reports.endDate")}
              </label>
              <input
                type="date"
                className="input w-full"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-2">
                {t("reports.reportType")}
              </label>
              <select
                className="input w-full"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="revenue">{t("reports.revenue")}</option>
                <option value="growth">{t("reports.growth")}</option>
                <option value="usage">{t("reports.usage")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Revenue Report */}
        {reportType === "revenue" && (
          <div className="space-y-8">
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">
                {t("reports.revenueReport")}
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name={t("reports.revenue")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">
                {t("reports.planDistribution")}
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Growth Report */}
        {reportType === "growth" && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">
              {t("reports.growthReport")}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newCompanies" fill="#10b981" name={t("reports.newCompanies")} />
                <Bar dataKey="total" fill="#3b82f6" name={t("reports.total")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Usage Report */}
        {reportType === "usage" && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">
              {t("reports.usageReport")}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f59e0b" name={t("reports.count")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

