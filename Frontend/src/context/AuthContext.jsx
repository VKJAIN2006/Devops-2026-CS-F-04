import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginRequest, register as registerRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("ems_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ems_user")) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getMe()
      .then((data) => {
        const currentUser = data?.user || data?.data || null;
        setUser(currentUser);
        if (currentUser) localStorage.setItem("ems_user", JSON.stringify(currentUser));
      })
      .catch(() => {
        localStorage.removeItem("ems_token");
        localStorage.removeItem("ems_user");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const saveAuth = (data) => {
    localStorage.setItem("ems_token", data.token);
    localStorage.setItem("ems_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    saveAuth(data);
    return data;
  };

  const register = async (payload) => {
    const data = await registerRequest(payload);
    saveAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ems_token");
    localStorage.removeItem("ems_user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, loading, isAuthenticated: Boolean(token && user), login, register, logout }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
