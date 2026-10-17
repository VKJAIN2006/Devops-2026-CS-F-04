import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarCheck2, CalendarDays, ClipboardList, Megaphone, Ticket, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEvents, getMyRegistrations } from "../services/api";

function formatDate(value) {
  if (!value) return "Date TBA";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([getMyRegistrations(), getEvents()])
      .then(([registrationResult, eventResult]) => {
        if (registrationResult.status === "fulfilled") setRegistrations(registrationResult.value);
        else setError(registrationResult.reason?.message || "Could not load registrations.");
        if (eventResult.status === "fulfilled") setEvents(eventResult.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeRegistrations = registrations.filter((item) => item.status !== "CANCELLED");
  const upcoming = useMemo(() => {
    const now = new Date();
    return activeRegistrations
      .filter((item) => item.event && (!item.event.startDate || new Date(item.event.startDate) >= now))
      .sort((a, b) => new Date(a.event?.startDate || 0) - new Date(b.event?.startDate || 0))
      .slice(0, 3);
  }, [activeRegistrations]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <span className="section-kicker">{user?.role || "STUDENT"} DASHBOARD</span>
          <h1>Welcome back, {user?.name || "Student"}!</h1>
          <p>Keep track of your events, registrations and campus activities from one place.</p>
        </div>
        <Link className="primary-btn dashboard-explore" to="/events"><CalendarDays size={16} /> Explore Events</Link>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat"><span className="dash-icon"><ClipboardList size={18}/></span><div><strong>{loading ? "—" : activeRegistrations.length}</strong><small>Active Registrations</small></div></div>
        <div className="dash-stat"><span className="dash-icon"><CalendarCheck2 size={18}/></span><div><strong>{loading ? "—" : events.length}</strong><small>Available Events</small></div></div>
        <div className="dash-stat"><span className="dash-icon"><Ticket size={18}/></span><div><strong>{loading ? "—" : registrations.length - activeRegistrations.length}</strong><small>Cancelled</small></div></div>
        <div className="dash-stat"><span className="dash-icon"><Users size={18}/></span><div><strong>{user?.role || "STUDENT"}</strong><small>Your Role</small></div></div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading"><div><span className="section-kicker">YOUR ACTIVITY</span><h2>Upcoming Registrations</h2></div><Link to="/registrations">View all <ArrowRight size={14}/></Link></div>
          {loading ? <div className="state-card">Loading your registrations...</div> :
            upcoming.length ? <div className="dashboard-list">{upcoming.map((item) => (
              <div className="dashboard-list-item" key={item._id}>
                <div className="list-date"><strong>{item.event?.startDate ? new Date(item.event.startDate).getDate() : "—"}</strong><small>{item.event?.startDate ? new Intl.DateTimeFormat("en-IN",{month:"short"}).format(new Date(item.event.startDate)) : ""}</small></div>
                <div className="list-main"><strong>{item.event?.title || "Event"}</strong><span>{item.event?.category || "EVENT"} · {item.event?.venue?.name || item.event?.venue || "Venue TBA"}</span></div>
                <span className={`status-pill ${String(item.status || "").toLowerCase()}`}>{item.status || "REGISTERED"}</span>
              </div>
            ))}</div>
            : <div className="empty-panel"><ClipboardList size={28}/><strong>No upcoming registrations</strong><span>Browse events and register for something interesting.</span><Link to="/events" className="outline-btn">Browse Events</Link></div>}
          {error && <p className="api-note error-state">{error}</p>}
        </section>

        <section className="dashboard-panel quick-panel">
          <div className="panel-heading"><div><span className="section-kicker">QUICK ACTIONS</span><h2>What do you want to do?</h2></div></div>
          <Link className="quick-action" to="/events"><span><CalendarDays size={18}/></span><div><strong>Browse Events</strong><small>Find workshops, fests and seminars</small></div><ArrowRight size={15}/></Link>
          <Link className="quick-action" to="/registrations"><span><ClipboardList size={18}/></span><div><strong>My Registrations</strong><small>View and manage your bookings</small></div><ArrowRight size={15}/></Link>
          <Link className="quick-action" to="/announcements"><span><Megaphone size={18}/></span><div><strong>Announcements</strong><small>See important campus updates</small></div><ArrowRight size={15}/></Link>
        </section>
      </div>
    </section>
  );
}
