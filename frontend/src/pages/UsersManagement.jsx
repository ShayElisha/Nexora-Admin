import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from "../api/api";

export default function UsersManagement() {
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
          <div className="space-y-6 animate-in" style={{ animationDelay: "0.2s" }}>
            {filtered.map((user, index) => (
              <div
                key={user._id}
                className="card border p-8 hover:border-[var(--gray-400)] transition-all"
                style={{
                  animationDelay: `${0.3 + index * 0.05}s`,
                  animation: "fadeIn 0.4s ease-out backwards",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-14 h-14 bg-[var(--black)] text-white flex items-center justify-center font-medium text-xl">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-medium mb-2">{user.name}</h3>
                      <div className="text-sm text-[var(--gray-500)] font-light mb-2">{user.email}</div>
                      <span className="badge badge-success">{user.role || "Admin"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="btn btn-secondary px-6"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="btn btn-secondary px-6"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--gray-200)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--gray-400)] font-light">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      Created {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-32 animate-in">
                <div className="w-20 h-20 mx-auto mb-8 border-2 border-[var(--gray-200)] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light mb-4">
                  {searchTerm ? "No Results" : "No Users"}
                </h3>
                <p className="text-[var(--gray-500)] font-light">
                  {searchTerm ? "Try a different search" : "Add your first admin user"}
                </p>
              </div>
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

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {user ? "Update" : "Add"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
