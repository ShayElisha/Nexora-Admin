import { useEffect, useState } from "react";
import { fetchAllCompanies } from "../api/api";

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const companies = await fetchAllCompanies(token);
        const companiesList = Array.isArray(companies) ? companies : [];

        // Generate activity log from companies data
        const activityList = [];

        companiesList.forEach((company) => {
          // Registration activity
          if (company.createdAt) {
            activityList.push({
              id: `${company._id}-created`,
              type: "registration",
              action: "Company Registered",
              companyName: company.name,
              companyId: company._id,
              user: "System",
              timestamp: company.createdAt,
              details: `${company.name} was registered`,
            });
          }

          // Update activity
          if (company.updatedAt && company.updatedAt !== company.createdAt) {
            activityList.push({
              id: `${company._id}-updated`,
              type: "update",
              action: "Company Updated",
              companyName: company.name,
              companyId: company._id,
              user: "System",
              timestamp: company.updatedAt,
              details: `${company.name} information was updated`,
            });
          }

          // Status change activity
          if (company.status) {
            activityList.push({
              id: `${company._id}-status`,
              type: "status_change",
              action: `Status: ${company.status}`,
              companyName: company.name,
              companyId: company._id,
              user: "Admin",
              timestamp: company.updatedAt || company.createdAt,
              details: `${company.name} status set to ${company.status}`,
            });
          }
        });

        // Sort by timestamp (newest first)
        activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setActivities(activityList);
      } catch (e) {
        setError(e?.message || "Failed to load activity log");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case "registration":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case "update":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case "status_change":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const filtered = activities.filter((activity) => {
    const matchesSearch =
      activity.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "all" || activity.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container">
        {/* Header */}
        <div className="mb-20 animate-in">
          <h1 className="text-6xl font-light mb-8 tracking-tight">Activity Log</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">Track all system activities</p>
        </div>

        {/* Filters */}
        <div className="mb-12 animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 max-w-2xl">
              <input
                type="text"
                placeholder="Search activities..."
                className="input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--black)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <select
              className="input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ maxWidth: "200px" }}
            >
              <option value="all">All Types</option>
              <option value="registration">Registrations</option>
              <option value="update">Updates</option>
              <option value="status_change">Status Changes</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="spinner mb-6" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
            <p className="text-[var(--gray-500)] font-light">Loading...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6 border border-[var(--gray-300)] bg-[var(--gray-50)] text-[var(--gray-700)] animate-in">
            {error}
          </div>
        )}

        {/* Activities List */}
        {!loading && !error && (
          <div className="space-y-4 animate-in" style={{ animationDelay: "0.2s" }}>
            {filtered.map((activity, index) => (
              <div
                key={activity.id}
                className="card border p-6 hover:border-[var(--gray-400)] transition-all"
                style={{
                  animationDelay: `${0.3 + index * 0.02}s`,
                  animation: "fadeIn 0.4s ease-out backwards",
                }}
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-[var(--gray-100)] flex items-center justify-center text-[var(--gray-600)] flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-medium">{activity.action}</h3>
                      <span className="badge badge-success text-xs">{activity.type}</span>
                    </div>
                    <p className="text-sm text-[var(--gray-600)] mb-3">{activity.details}</p>
                    <div className="flex items-center gap-6 text-xs text-[var(--gray-500)]">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{activity.user}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {activity.timestamp
                            ? new Date(activity.timestamp).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                      {activity.companyName && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{activity.companyName}</span>
                        </div>
                      )}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light mb-4">
                  {searchTerm || filterType !== "all" ? "No Results" : "No Activity"}
                </h3>
                <p className="text-[var(--gray-500)] font-light">
                  {searchTerm || filterType !== "all" ? "Try adjusting your filters" : "Activity will appear here"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
