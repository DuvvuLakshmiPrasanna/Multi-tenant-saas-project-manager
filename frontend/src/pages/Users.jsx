import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const Users = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant?.id || user?.tenantId || null;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    if (tenantId) {
      fetchUsers(tenantId);
    } else if (user) {
      setLoading(false);
    }
  }, [tenantId, user]);

  const fetchUsers = async (activeTenantId) => {
    try {
      const res = await api.get(`/tenants/${activeTenantId}/users`);
      if (res.data.success) setUsers(res.data.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/tenants/${tenantId}/users`, newUser);
      if (res.data.success) {
        setShowModal(false);
        setNewUser({ fullName: "", email: "", password: "", role: "user" });
        fetchUsers(tenantId);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error creating user");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers(tenantId);
    } catch (err) {
      alert("Error deleting user");
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!tenantId) {
    return (
      <div>No tenant context available. Please log in as a tenant admin.</div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 className="title">Team Members</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Add Member
        </button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background:
                        u.role === "tenant_admin"
                          ? "rgba(56, 139, 253, 0.15)"
                          : "rgba(110, 118, 129, 0.15)",
                      color: u.role === "tenant_admin" ? "#58a6ff" : "#8b949e",
                      border: `1px solid ${u.role === "tenant_admin" ? "rgba(56, 139, 253, 0.4)" : "rgba(110, 118, 129, 0.4)"}`,
                      fontSize: "0.75rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {u.role.replace("_", " ")}
                  </span>
                </td>
                <td>
                  {u.isActive ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-danger">Inactive</span>
                  )}
                </td>
                <td>
                  {u.id !== user.id && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="btn-danger"
                      style={{
                        border: "none",
                        cursor: "pointer",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="title" style={{ fontSize: "1.5rem" }}>
              Add New User
            </h2>
            <form onSubmit={handleCreate}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                Full Name
              </label>
              <input
                className="input-field"
                required
                value={newUser.fullName}
                onChange={(e) =>
                  setNewUser({ ...newUser, fullName: e.target.value })
                }
              />

              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                Email
              </label>
              <input
                type="email"
                className="input-field"
                required
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />

              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                Password
              </label>
              <input
                type="password"
                className="input-field"
                required
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />

              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                Role
              </label>
              <select
                className="input-field"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="tenant_admin">Admin</option>
              </select>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
