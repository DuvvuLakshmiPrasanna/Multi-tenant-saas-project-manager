import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (userData) => {
    if (!userData) return null;
    const tenantId = userData.tenant?.id || userData.tenantId || null;
    return {
      ...userData,
      tenantId,
      tenant: userData.tenant || null,
    };
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Validate token structure/expiry first
          // jwtDecode(token);
          // Or just verify with backend
          const { data } = await api.get("/auth/me");
          if (data.success) {
            setUser(normalizeUser(data.data));
          }
        } catch (err) {
          console.error("Auth init failed", err);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password, tenantSubdomain) => {
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
        tenantSubdomain,
      });
      if (data.success) {
        localStorage.setItem("token", data.data.token);
        try {
          const meRes = await api.get("/auth/me");
          if (meRes.data.success) {
            setUser(normalizeUser(meRes.data.data));
          } else {
            setUser(normalizeUser(data.data.user));
          }
        } catch (err) {
          setUser(normalizeUser(data.data.user));
        }
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  const registerTenant = async (formData) => {
    try {
      const { data } = await api.post("/auth/register-tenant", formData);
      return data;
    } catch (err) {
      throw err.response?.data || { message: "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, registerTenant, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
