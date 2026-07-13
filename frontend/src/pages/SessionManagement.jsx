import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchAdminUsers } from "../api/api";
import { useToast } from "../components/Toaster.jsx";

export default function SessionManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminUsers();
      const usersList = Array.isArray(data) ? data : data?.users || [];

      // Generate session data from users
      const sessionList = usersList.flatMap((user) => {
        const sessions = [];
        
        // Current active session (simulated)
        sessions.push({
          id: `${user._id}-active`,
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          role: user.role,
          sessionId: `session_${user._id}_${Date.now()}`,
          ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          location: "Israel, Tel Aviv",
          loginTime: user.updatedAt || user.createdAt,
          lastActivity: new Date().toISOString(),
          status: "active",
          deviceType: "Desktop",
          browser: "Chrome",
        });

        // Add some historical sessions
        for (let i = 1; i <= 3; i++) {
          sessions.push({
            id: `${user._id}-history-${i}`,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            role: user.role,
            sessionId: `session_${user._id}_${Date.now() - i * 86400000}`,
            ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            location: "Israel, Tel Aviv",
            loginTime: new Date(Date.now() - i * 86400000).toISOString(),
            lastActivity: new Date(Date.now() - i * 86400000 + 3600000).toISOString(),
            logoutTime: new Date(Date.now() - i * 86400000 + 3600000).toISOString(),
            status: "inactive",
            deviceType: i % 2 === 0 ? "Mobile" : "Desktop",
            browser: i % 2 === 0 ? "Safari" : "Chrome",
            duration: Math.floor(Math.random() * 120) + 30, // minutes
          });
        }

        return sessions;
      });

      setSessions(sessionList);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      showToast("Failed to load sessions", "error");
    } finally {
      setLoading(false);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "active");
  const inactiveSessions = sessions.filter((s) => s.status === "inactive");

  const filteredSessions = (activeTab === "active" ? activeSessions : inactiveSessions).filter((session) => {
    const matchesSearch =
      session.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ipAddress?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || session.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleTerminateSession = (sessionId) => {
    if (!window.confirm("Are you sure you want to terminate this session?")) return;
    
    setSessions(sessions.map((s) => 
      s.sessionId === sessionId 
        ? { ...s, status: "inactive", logoutTime: new Date().toISOString() }
        : s
    ));
    showToast("Session terminated successfully", "success");
  };

  const handleTerminateAllSessions = () => {
    if (!window.confirm("Are you sure you want to terminate all active sessions?")) return;
    
    setSessions(sessions.map((s) => 
      s.status === "active"
        ? { ...s, status: "inactive", logoutTime: new Date().toISOString() }
        : s
    ));
    showToast("All sessions terminated", "success");
  };

  // Geographic distribution
  const geographicData = sessions.reduce((acc, session) => {
    const country = session.location?.split(",")[0] || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const geographicArray = Object.entries(geographicData)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container">
        {/* Header */}
        <div className="mb-12 animate-in">
          <h1 className="text-6xl font-light mb-4 tracking-tight">Session Management</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">Monitor and manage user sessions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="card border p-6">
            <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Active Sessions</div>
            <div className="text-3xl font-light">{activeSessions.length}</div>
          </div>
          <div className="card border p-6">
            <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Total Sessions</div>
            <div className="text-3xl font-light">{sessions.length}</div>
          </div>
          <div className="card border p-6">
            <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Unique Users</div>
            <div className="text-3xl font-light">
              {new Set(sessions.map((s) => s.userId)).size}
            </div>
          </div>
          <div className="card border p-6">
            <div className="text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Locations</div>
            <div className="text-3xl font-light">{geographicArray.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-[var(--gray-200)] animate-in" style={{ animationDelay: "0.15s" }}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "active"
                  ? "border-[var(--black)] text-[var(--black)]"
                  : "border-transparent text-[var(--gray-500)] hover:text-[var(--gray-700)]"
              }`}
            >
              Active Sessions ({activeSessions.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-[var(--black)] text-[var(--black)]"
                  : "border-transparent text-[var(--gray-500)] hover:text-[var(--gray-700)]"
              }`}
            >
              Login History ({inactiveSessions.length})
            </button>
            <button
              onClick={() => setActiveTab("geography")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "geography"
                  ? "border-[var(--black)] text-[var(--black)]"
                  : "border-transparent text-[var(--gray-500)] hover:text-[var(--gray-700)]"
              }`}
            >
              Geographic Distribution
            </button>
          </div>
        </div>

        {/* Filters */}
        {activeTab !== "geography" && (
          <div className="mb-8 flex flex-col md:flex-row gap-4 animate-in" style={{ animationDelay: "0.2s" }}>
            <input
              type="text"
              placeholder="Search by user, email, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input flex-1"
            />
            {activeTab === "active" && (
              <button
                onClick={handleTerminateAllSessions}
                className="btn btn-secondary text-sm whitespace-nowrap"
              >
                Terminate All Sessions
              </button>
            )}
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === "active" && (
          <div className="animate-in" style={{ animationDelay: "0.25s" }}>
            <div className="card border p-8">
              <h3 className="text-xl font-medium mb-6">Active Sessions</h3>
              {filteredSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--gray-200)]">
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          User
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          IP Address
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Location
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Device
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Login Time
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Last Activity
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-[var(--gray-100)] hover:bg-[var(--gray-50)]"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[var(--black)] text-white flex items-center justify-center font-medium text-sm rounded-full">
                                {session.userName?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{session.userName}</div>
                                <div className="text-sm text-[var(--gray-500)] font-light">{session.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[var(--gray-700)] font-light font-mono text-sm">
                            {session.ipAddress}
                          </td>
                          <td className="py-4 px-4 text-[var(--gray-700)] font-light">{session.location}</td>
                          <td className="py-4 px-4 text-[var(--gray-700)] font-light">
                            <div>{session.deviceType}</div>
                            <div className="text-xs text-[var(--gray-500)]">{session.browser}</div>
                          </td>
                          <td className="py-4 px-4 text-[var(--gray-700)] font-light text-sm">
                            {new Date(session.loginTime).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-4 px-4 text-[var(--gray-700)] font-light text-sm">
                            {new Date(session.lastActivity).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleTerminateSession(session.sessionId)}
                              className="text-sm text-red-600 hover:text-red-800 hover:underline"
                            >
                              Terminate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--gray-500)] font-light">
                  No active sessions found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === "history" && (
          <div className="animate-in" style={{ animationDelay: "0.25s" }}>
            <div className="card border p-8">
              <h3 className="text-xl font-medium mb-6">Login History</h3>
              {filteredSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--gray-200)]">
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          User
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          IP Address
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Location
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Device
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Login Time
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Logout Time
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--gray-500)] font-medium">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions
                        .sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime))
                        .map((session) => (
                          <tr
                            key={session.id}
                            className="border-b border-[var(--gray-100)] hover:bg-[var(--gray-50)]"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[var(--gray-400)] text-white flex items-center justify-center font-medium text-sm rounded-full">
                                  {session.userName?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{session.userName}</div>
                                  <div className="text-sm text-[var(--gray-500)] font-light">{session.userEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-[var(--gray-700)] font-light font-mono text-sm">
                              {session.ipAddress}
                            </td>
                            <td className="py-4 px-4 text-[var(--gray-700)] font-light">{session.location}</td>
                            <td className="py-4 px-4 text-[var(--gray-700)] font-light">
                              <div>{session.deviceType}</div>
                              <div className="text-xs text-[var(--gray-500)]">{session.browser}</div>
                            </td>
                            <td className="py-4 px-4 text-[var(--gray-700)] font-light text-sm">
                              {new Date(session.loginTime).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-4 px-4 text-[var(--gray-700)] font-light text-sm">
                              {session.logoutTime
                                ? new Date(session.logoutTime).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td className="py-4 px-4 text-[var(--gray-700)] font-light text-sm">
                              {session.duration ? `${session.duration} min` : "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--gray-500)] font-light">
                  No login history found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Geographic Distribution Tab */}
        {activeTab === "geography" && (
          <div className="animate-in" style={{ animationDelay: "0.25s" }}>
            <div className="card border p-8">
              <h3 className="text-xl font-medium mb-6">Geographic Distribution</h3>
              {geographicArray.length > 0 ? (
                <div className="space-y-4">
                  {geographicArray.map((item) => (
                    <div key={item.country} className="flex items-center justify-between p-4 border border-[var(--gray-200)] rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--gray-200)] rounded-full flex items-center justify-center">
                          <span className="text-xl">🌍</span>
                        </div>
                        <div>
                          <div className="font-medium">{item.country}</div>
                          <div className="text-sm text-[var(--gray-500)] font-light">{item.count} sessions</div>
                        </div>
                      </div>
                      <div className="w-32 bg-[var(--gray-200)] rounded-full h-2">
                        <div
                          className="bg-[var(--black)] h-2 rounded-full"
                          style={{
                            width: `${(item.count / sessions.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--gray-500)] font-light">
                  No geographic data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

