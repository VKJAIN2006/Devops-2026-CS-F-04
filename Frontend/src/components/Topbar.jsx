import { Bell, ChevronDown, Search, UserCircle, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Brand from "./Brand";
import { useTheme } from "../context/ThemeContext";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="mobile-brand"><Brand /></div>
      <div className="global-search">
        <Search size={17} />
        <input
          aria-label="Search events"
          placeholder="Search events, venues, departments..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              navigate(`/events?search=${encodeURIComponent(e.currentTarget.value.trim())}`);
            }
          }}
        />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-btn" aria-label="Announcements" onClick={() => navigate("/announcements")}>
          <Bell size={19} />
        </button>

        <div className="profile-menu" ref={menuRef}>
          <button
            className="profile-chip"
            type="button"
            onClick={() => isAuthenticated ? setOpen((value) => !value) : navigate("/login")}
            aria-expanded={open}
          >
            <span className="avatar">{(user?.name || "S").charAt(0).toUpperCase()}</span>
            <span className="profile-text">
              <strong>{user?.name || "Sign In"}</strong>
              <small>{user?.role || "Student"}</small>
            </span>
            <ChevronDown size={15} />
          </button>

          {isAuthenticated && open && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-head">
                <div className="avatar large">{(user?.name || "S").charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{user?.name || "Student"}</strong>
                  <small>{user?.email || ""}</small>
                </div>
              </div>
              <Link to="/dashboard" onClick={() => setOpen(false)}><LayoutDashboardIcon /> Dashboard</Link>
              <Link to="/profile" onClick={() => setOpen(false)}><UserCircle size={16} /> Profile</Link>
              <button type="button" onClick={handleLogout}><LogOut size={16} /> Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function LayoutDashboardIcon() {
  return <span style={{ display: "inline-flex" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>;
}
