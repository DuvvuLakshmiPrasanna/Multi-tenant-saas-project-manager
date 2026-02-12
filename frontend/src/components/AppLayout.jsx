import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const tenantId = user?.tenant?.id || user?.tenantId || null;
  const isSuperAdmin = user?.role === "super_admin";

  const NavItem = ({ to, label, icon }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link to={to} className={`nav-link ${isActive ? "active" : ""}`}>
        <span style={{ marginRight: "0.75rem" }}>{icon || "•"}</span>
        {label}
      </Link>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-area">
          <h1
            style={{
              margin: 0,
              fontSize: "1.25rem",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {tenantId ? user?.tenant?.name || "SaaS Platform" : "SaaS Platform"}
          </h1>
          {tenantId && (
            <small className="subtitle">
              {user?.tenant?.subdomain}.app.com
            </small>
          )}
          {!tenantId && isSuperAdmin && (
            <small className="subtitle">Super Admin Console</small>
          )}
        </div>

        <nav style={{ flex: 1, padding: "0.5rem" }}>
          <NavItem to="/dashboard" label="Dashboard" icon="📊" />
          {tenantId && (
            <>
              <NavItem to="/projects" label="Projects" icon="📁" />
              {(user?.role === "tenant_admin" ||
                user?.role === "super_admin") && (
                <NavItem
                  to="/users"
                  label="Team Members"
                  icon="busts_in_silhouette"
                />
              )}
            </>
          )}
        </nav>

        <div
          style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}
        >
          <div
            style={{
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#c9d1d9",
                }}
              >
                {user?.fullName}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  textTransform: "capitalize",
                }}
              >
                {user?.role?.replace("_", " ")}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
