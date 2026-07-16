import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from "../api/api";
import EmptyState from "../components/ui/EmptyState.jsx";
import { formatDateLong } from "../utils/formatDate.js";
import PageShell from "../components/ui/PageShell.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Toolbar from "../components/ui/Toolbar.jsx";
import { Users } from "lucide-react";

export default function UsersManagement() {
  const { t } = useTranslation();
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
      showNotification(t("users.addedSuccess"));
    } catch (e) {
      showNotification(e?.message || t("users.failedToAdd"), "error");
    }
  };

  const handleEditUser = async (id, userData) => {
    try {
      await updateAdminUser(id, userData);
      setUsers(users.map((u) => (u._id === id ? { ...u, ...userData } : u)));
      setEditingUser(null);
      showNotification(t("users.updatedSuccess"));
    } catch (e) {
      showNotification(e?.message || t("users.failedToUpdate"), "error");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(t("users.deleteUserConfirm"))) return;

    try {
      await deleteAdminUser(id);
      setUsers(users.filter((u) => u._id !== id));
      showNotification(t("users.deletedSuccess"));
    } catch (e) {
      showNotification(e?.message || t("users.failedToDelete"), "error");
    }
  };

  const roleLabel = (role) => {
    if (role === "Super Admin") return t("users.roles.superAdmin");
    if (role === "Manager") return t("users.roles.manager");
    return t("users.roles.admin");
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageShell>
      {notification && (
        <div
          className={`fixed top-24 end-6 z-50 px-6 py-4 border shadow-lg animate-scale rounded-2xl backdrop-blur-md ${
            notification.type === "success"
              ? "bg-[var(--bg-elevated)] border-[var(--border)]"
              : "bg-rose-600 text-white border-rose-500"
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

      <PageHeader
        title={t("users.pageTitle")}
        subtitle={t("users.pageSubtitle")}
        icon={<Users className="w-5 h-5" />}
        actions={
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-compact">
            + {t("users.addUser")}
          </button>
        }
      />

      <Toolbar>
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <input
            type="text"
            placeholder={t("users.searchUsers")}
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </Toolbar>

      {loading && (
        <div className="flex flex-col items-center justify-center py-28">
          <div className="spinner mb-6" style={{ width: "40px", height: "40px", borderWidth: "2px" }} />
          <p className="text-[var(--text-muted)]">{t("common.loading")}</p>
        </div>
      )}

      {error && (
        <div className="card border border-[var(--error)]/20 bg-[rgba(239,68,68,0.06)] text-[var(--error)]">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="list-stack max-w-4xl">
          {filtered.map((user) => (
            <div key={user._id} className="list-item">
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
                      <span className="badge badge-success">{roleLabel(user.role)}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {t("users.created", {
                          date: user.createdAt ? formatDateLong(user.createdAt) : "—",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="btn btn-secondary btn-compact"
                  >
                    {t("users.edit")}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="btn btn-secondary btn-compact text-rose-600"
                  >
                    {t("users.delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card card-elevated">
              <EmptyState
                title={searchTerm ? t("companies.noResults") : t("empty.noUsers")}
                description={
                  searchTerm ? t("companies.tryDifferent") : t("empty.noUsersDesc")
                }
                actionLabel={!searchTerm ? `+ ${t("users.addUser")}` : undefined}
                onAction={!searchTerm ? () => setShowAddModal(true) : undefined}
              />
            </div>
          )}
        </div>
      )}

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
    </PageShell>
  );
}

function UserModal({ user, onClose, onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "Admin",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!user && !formData.password)) {
      alert(t("users.fillRequired"));
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full animate-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light">
            {user ? t("users.editUser") : t("users.addUser")}
          </h2>
          <button onClick={onClose} className="text-[var(--gray-400)] hover:text-[var(--black)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {t("users.name")}
            </label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {t("users.email")}
            </label>
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
              <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
                {t("users.password")}
              </label>
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
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {t("users.role")}
            </label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Admin">{t("users.roles.admin")}</option>
              <option value="Super Admin">{t("users.roles.superAdmin")}</option>
              <option value="Manager">{t("users.roles.manager")}</option>
            </select>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-compact">
              {t("users.cancel")}
            </button>
            <button type="submit" className="btn btn-primary btn-compact">
              {user ? t("users.update") : t("users.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
