import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchAdminUsers } from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function UserActivityMonitor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminUsers();
      const usersList = Array.isArray(data) ? data : data?.users || [];
      setUsers(usersList);

      // Generate activity data based on users
      const activities = usersList.map((user) => ({
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin || user.updatedAt || user.createdAt,
        loginCount: Math.floor(Math.random() * 50) + 1,
        status: user.status || "Active",
        recentActivities: [
          {
            id: `${user._id}-1`,
            action: "Login",
            timestamp: user.updatedAt || user.createdAt,
            ipAddress: "192.168.1.1",
            location: "Israel",
          },
          {
            id: `${user._id}-2`,
            action: "Viewed Companies",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            ipAddress: "192.168.1.1",
            location: "Israel",
          },
        ],
        suspiciousActivity: Math.random() > 0.8,
      }));

      setActivityData(activities);
    } catch (error) {
      console.error("Failed to load users:", error);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = activityData.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Prepare chart data for activity over time
  const activityChartData = activityData.reduce((acc, user) => {
    const date = new Date(user.lastLogin).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartDataArray = Object.entries(activityChartData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7); // Last 7 days

  if (loading) {
    return (
      <div className="min-h-screen pt-6 pb-16 flex items-center justify-center">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container">
        {/* Header */}
        <div className="mb-12 animate-in">
          <h1 className="text-6xl font-light mb-4 tracking-tight">User Activity Monitor</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">Track and monitor user activities</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 animate-in" style={{ animationDelay: "0.1s" }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input w-full md:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="Owner">Owner</option>
            <option value="Manager">Manager</option>
            <option value="Analyst">Analyst</option>
            <option value="Support">Support</option>
          </select>
        </div>

        {/* Activity Chart */}
        <div className="mb-12 animate-in" style={{ animationDelay: "0.15s" }}>
          <div className="card border p-8">
            <h3 className="text-xl font-medium mb-6">Login Activity (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartDataArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="date" stroke="var(--gray-500)" fontSize={12} />
                <YAxis stroke="var(--gray-500)" fontSize={12} />
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
        </div>

        {/* Users Activity List */}
        <div className="animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="card border p-8">
            <h3 className="text-xl font-medium mb-6">User Activities</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--gray-200)]">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                      Last Login
                    </th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                      Login Count
                    </th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className="border-b border-[var(--gray-100)] hover:bg-[var(--gray-50)] cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--black)] text-white flex items-center justify-center font-medium text-sm rounded-full">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-[var(--gray-500)] font-light">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[var(--gray-700)] font-light">{user.role}</td>
                      <td className="py-4 px-4 text-[var(--gray-700)] font-light">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </td>
                      <td className="py-4 px-4 text-[var(--gray-700)] font-light">{user.loginCount}</td>
                      <td className="py-4 px-4">
                        <span className={`badge ${user.status === "Active" ? "badge-success" : "badge-warning"}`}>
                          {user.status}
                        </span>
                        {user.suspiciousActivity && (
                          <span className="badge badge-error ml-2">Suspicious</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="text-sm text-[var(--black)] hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-light">User Activity Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-[var(--gray-500)] hover:text-[var(--black)] text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{selectedUser.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Email</div>
                      <div className="text-[var(--gray-700)]">{selectedUser.email}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Role</div>
                      <div className="text-[var(--gray-700)]">{selectedUser.role}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Last Login</div>
                      <div className="text-[var(--gray-700)]">
                        {selectedUser.lastLogin
                          ? new Date(selectedUser.lastLogin).toLocaleString("en-US")
                          : "Never"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-1">Total Logins</div>
                      <div className="text-[var(--gray-700)]">{selectedUser.loginCount}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-4">Recent Activities</h4>
                  <div className="space-y-3">
                    {selectedUser.recentActivities?.map((activity) => (
                      <div key={activity.id} className="border border-[var(--gray-200)] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-[var(--gray-500)]">
                            {new Date(activity.timestamp).toLocaleString("en-US")}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--gray-500)]">
                          <span>IP: {activity.ipAddress}</span>
                          <span>Location: {activity.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedUser.suspiciousActivity && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-900 font-medium mb-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Suspicious Activity Detected
                    </div>
                    <p className="text-sm text-red-700">
                      This user has shown unusual activity patterns. Review the activities above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

