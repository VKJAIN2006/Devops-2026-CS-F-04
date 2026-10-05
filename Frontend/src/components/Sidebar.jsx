import { Award, Bell, CalendarDays, Home as HomeIcon, MessageSquare, ClipboardList, LayoutDashboard, PlusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import Brand from "./Brand";

const items = [
  { to: "/", label: "Home", icon: HomeIcon, public: true },
  { to: "/events", label: "Browse Events", icon: CalendarDays, public: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/registrations", label: "My Registrations", icon: ClipboardList },
  { to: "/certificates", label: "My Certificates", icon: Award },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
  { to: "/announcements", label: "Announcements", icon: Bell },
];

export default function Sidebar() {
  const { user } = useAuth();
  const isOrganizer = user?.role === "ORGANIZER";
  const isAdmin = user?.role === "ADMIN";
  return (
    <aside className="sidebar">
      <Brand />
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {isOrganizer && <div className="sidebar-section-label">ORGANIZER</div>}
      {isOrganizer && <NavLink to="/organizer/events" className={({ isActive }) => `side-link organizer-create-link ${isActive ? "active" : ""}`}><PlusCircle size={17} /><span>My Events</span></NavLink>}
      {isOrganizer && <NavLink to="/organizer/events/create" className={({ isActive }) => `side-link organizer-create-link ${isActive ? "active" : ""}`}><PlusCircle size={17} /><span>Create Event</span></NavLink>}
      {isAdmin && <div className="sidebar-section-label">ADMIN</div>}
      {isAdmin && <NavLink to="/admin/approvals" className={({ isActive }) => `side-link organizer-create-link ${isActive ? "active" : ""}`}><ClipboardList size={17} /><span>Event Approvals</span></NavLink>}
      <div className="sidebar-footer">
        <span>SKIT Jaipur</span>
        <small>Event Management System</small>
      </div>
    </aside>
  );
}
