import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTenants: 0 });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get("/tenants");
      if (res.data.success) {
        setTenants(res.data.data.tenants);
        setStats({ totalTenants: res.data.data.pagination.totalTenants });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <h2 className="title">Super Admin Dashboard</h2>
        <p className="subtitle">Platform Management Console</p>
      </header>

      {/* Stats Grid */}
      <div className="grid-3" style={{ marginBottom: "3rem" }}>
        <div className="card">
          <h3 className="subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
            Total Tenants
          </h3>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "var(--accent-primary)",
            }}
          >
            {stats.totalTenants}
          </div>
        </div>
        <div className="card">
          <h3 className="subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
            Active Tenants
          </h3>
          <div
            style={{ fontSize: "2.5rem", fontWeight: 700, color: "#238636" }}
          >
            {tenants.filter((t) => t.status === "active").length}
          </div>
        </div>
        <div className="card">
          <h3 className="subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
            Suspended Tenants
          </h3>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "var(--warning)",
            }}
          >
            {tenants.filter((t) => t.status === "suspended").length}
          </div>
        </div>
      </div>

      {/* Tenants List */}
      <section>
        <h3 style={{ marginBottom: "1rem" }}>All Tenants</h3>
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Subdomain</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        background: "rgba(110, 118, 129, 0.15)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                      }}
                    >
                      {tenant.subdomain}.app.com
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        background:
                          tenant.subscriptionPlan === "enterprise"
                            ? "rgba(56, 139, 253, 0.15)"
                            : "rgba(110, 118, 129, 0.15)",
                        color:
                          tenant.subscriptionPlan === "enterprise"
                            ? "#58a6ff"
                            : "#8b949e",
                        border: `1px solid ${tenant.subscriptionPlan === "enterprise" ? "rgba(56, 139, 253, 0.4)" : "rgba(110, 118, 129, 0.4)"}`,
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {tenant.subscriptionPlan}
                    </span>
                  </td>
                  <td>
                    {tenant.status === "active" ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Suspended</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
