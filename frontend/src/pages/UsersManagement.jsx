import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from "../api/api";
import EmptyState from "../components/ui/EmptyState.jsx";
import { formatDateLong } from "../utils/formatDate.js";

export default function UsersManagement() {
  const { t: tEmpty } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchAdminUsers();
        setUsers(Array.isArray(data) ? data : data?.users || []);
      } catch (e) {
        // Fallback to current user if API fails
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (currentUser) {
          setUsers([
            {
              _id: "1",
              name: currentUser.name || "Admin User",
              email: currentUser.email || "admin@nexora.com",
              role: "Super Admin",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddUser = async (userData) => {
    try {
      const newUser = await createAdminUser(userData);
      setUsers([...users, newUser]);
      setShowAddModal(false);
      showNotification("User added successfully");
    } catch (e) {
      showNotification(e?.message || "Failed to add user", "error");
    }
  };

  const handleEditUser = async (id, userData) => {
    try {
      await updateAdminUser(id, userData);
      setUsers(users.map((u) => (u._id === id ? { ...u, ...userData } : u)));
      setEditingUser(null);
      showNotification("User updated successfully");
    } catch (e) {
      showNotification(e?.message || "Failed to update user", "error");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteAdminUser(id);
      setUsers(users.filter((u) => u._id !== id));
      showNotification("User deleted successfully");
    } catch (e) {
      showNotification(e?.message || "Failed to delete user", "error");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-8 py-5 border shadow-lg animate-scale rounded-xl backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-[var(--white)] border-[var(--gray-300)]"
              : "bg-[var(--gray-900)] text-white border-[var(--gray-700)]"
          }`}
        >
          <div className="text-sm font-medium flex items-center gap-2">
            {notification.type === "success" ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="container">
        {/* Header */}
        <div className="mb-20 animate-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-6xl font-light mb-8 tracking-tight">Users</h1>
              <p className="text-xl text-[var(--gray-500)] font-light">Manage admin users</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              + Add User
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-12 animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search users..."
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

        {/* Users List */}
        {!loading && !error && (
          <div className="max-w-4xl space-y-4 animate-in" style={{ animationDelay: "0.2s" }}>
            {filtered.map((user, index) => (
              <div
                key={user._id}
                className="card card-elevated p-5 hover:shadow-md transition-shadow"
                style={{
                  animationDelay: `${0.3 + index * 0.05}s`,
                  animation: "fadeIn 0.4s ease-out backwards",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold text-lg shrink-0">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                        {user.name}
                      </h3>
                      <div className="text-sm text-[var(--text-secondary)] truncate">{user.email}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="badge badge-success">{user.role || "Admin"}</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          Created {user.createdAt ? formatDateLong(user.createdAt) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="btn btn-secondary btn-compact"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="btn btn-secondary btn-compact text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filtered.length === 0 && (
              <EmptyState
                title={searchTerm ? "No Results" : tEmpty("empty.noUsers")}
                description={
                  searchTerm ? "Try a different search" : tEmpty("empty.noUsersDesc")
                }
                actionLabel={!searchTerm ? "+ Add User" : undefined}
                onAction={!searchTerm ? () => setShowAddModal(true) : undefined}
              />
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowAddModal(false);
            setEditingUser(null);
          }}
          onSave={(userData) => {
            if (editingUser) {
              handleEditUser(editingUser._id, userData);
            } else {
              handleAddUser(userData);
            }
          }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "Admin",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!user && !formData.password)) {
      alert("Please fill in all required fields");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full animate-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light">{user ? "Edit User" : "Add User"}</h2>
          <button onClick={onClose} className="text-[var(--gray-400)] hover:text-[var(--black)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Name</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Email</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {!user && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Password</label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">Role</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option>Admin</option>
              <option>Super Admin</option>
              <option>Manager</option>
            </select>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-compact">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-compact">
              {user ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
