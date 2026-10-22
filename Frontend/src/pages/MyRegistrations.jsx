import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, XCircle, Eye, RotateCcw, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cancelRegistration, getMyRegistrations } from "../services/api";

function formatDate(value) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getEventId(event, item) {
  return event?._id || event?.id || item?.eventId || item?.event?._id || item?.event?.id;
}

function RegistrationCard({ item, onCancel, onView, onRegisterAgain }) {
  const event = item?.event || item?.eventId || {};
  const registrationId = item?._id || item?.id;
  const status = String(item?.status || "REGISTERED").toUpperCase();
  const cancelled = status === "CANCELLED";
  const eventId = getEventId(event, item);
  const start = event?.startDate ? new Date(event.startDate) : null;
  const completed = start && !Number.isNaN(start.getTime()) && start < new Date();

  return (
    <article className={`registration-card ${cancelled ? "is-cancelled" : ""} ${completed ? "is-completed" : ""}`}>
      <div className="registration-accent">
        {completed ? <CheckCircle2 size={22} /> : <CalendarDays size={22} />}
      </div>

      <div className="registration-info">
        <span className="event-category">{event?.category || "EVENT"}</span>
        <h2>{event?.title || "Registered Event"}</h2>
        <p>{event?.description || "No description available."}</p>

        <div className="registration-meta">
          <span><CalendarDays size={14} />{formatDate(event?.startDate)}</span>
          <span><MapPin size={14} />{event?.venue?.name || event?.venue || "Venue TBA"}</span>
        </div>
      </div>

      <div className="registration-side">
        <span className={`status-pill ${status.toLowerCase()}`}>
          {completed && !cancelled ? "COMPLETED" : status}
        </span>

        <div className="registration-actions">
          {eventId && (
            <button className="view-registration-btn" type="button" onClick={() => onView(eventId)}>
              <Eye size={14} /> View Event
            </button>
          )}

          {cancelled ? (
            eventId && !completed ? (
              <button className="register-again-btn" type="button" onClick={() => onRegisterAgain(eventId)}>
                <RotateCcw size={14} /> Register Again
              </button>
            ) : null
          ) : (
            registrationId && !completed && (
              <button className="cancel-btn" type="button" onClick={() => onCancel(registrationId)}>
                <XCircle size={14} /> Cancel
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export default function MyRegistrations() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      setMessage("");
      const registrations = await getMyRegistrations();
      setItems(Array.isArray(registrations) ? registrations : []);
    } catch (error) {
      console.error("My Registrations error:", error);
      setItems([]);
      setMessage(error?.message || "Unable to load your registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRegistrations(); }, []);

  const cancel = async (id) => {
    if (!id) return;
    if (!window.confirm("Cancel this registration? You can register again later if registration is still open.")) return;
    try {
      await cancelRegistration(id);
      setMessage("Registration cancelled successfully. You can register again while registration is open.");
      await loadRegistrations();
    } catch (error) {
      console.error("Cancel registration error:", error);
      setMessage(error?.message || "Unable to cancel this registration.");
    }
  };

  const groups = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const cancelled = [];
    const completed = [];

    items.forEach((item) => {
      const status = String(item?.status || "REGISTERED").toUpperCase();
      const event = item?.event || item?.eventId || {};
      const start = event?.startDate ? new Date(event.startDate) : null;
      const isCompleted = start && !Number.isNaN(start.getTime()) && start < now;

      if (status === "CANCELLED") cancelled.push(item);
      else if (isCompleted) completed.push(item);
      else upcoming.push(item);
    });

    return { upcoming, cancelled, completed };
  }, [items]);

  if (loading) {
    return (
      <section className="listing-page">
        <div className="section-heading"><div><span className="section-kicker">MY ACTIVITY</span><h1>My Registrations</h1><p>View the events you have registered for and manage your bookings.</p></div></div>
        <div className="state-card">Loading your registrations...</div>
      </section>
    );
  }

  const hasItems = items.length > 0;

  return (
    <section className="listing-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">MY ACTIVITY</span>
          <h1>My Registrations</h1>
          <p>View the events you have registered for and manage your bookings.</p>
        </div>
      </div>

      {message && <div className="notice-box">{message}</div>}

      {!hasItems ? (
        <div className="state-card">
          <strong>No registrations yet.</strong>
          <p>Browse upcoming events and register for one to see it here.</p>
          <button className="outline-btn" type="button" onClick={() => navigate("/events")}>Browse Events</button>
        </div>
      ) : (
        <div className="registration-sections">
          {groups.upcoming.length > 0 && (
            <section className="registration-section">
              <div className="registration-section-heading"><div><span className="section-kicker">ACTIVE</span><h2>Upcoming Events</h2></div><span>{groups.upcoming.length} registration{groups.upcoming.length !== 1 ? "s" : ""}</span></div>
              <div className="registration-list">{groups.upcoming.map((item, index) => <RegistrationCard key={item?._id || item?.id || index} item={item} onCancel={cancel} onView={(id) => navigate(`/events/${id}`)} onRegisterAgain={(id) => navigate(`/events/${id}`)} />)}</div>
            </section>
          )}

          {groups.completed.length > 0 && (
            <section className="registration-section">
              <div className="registration-section-heading"><div><span className="section-kicker">HISTORY</span><h2>Completed Events</h2></div><span>{groups.completed.length} event{groups.completed.length !== 1 ? "s" : ""}</span></div>
              <div className="registration-list">{groups.completed.map((item, index) => <RegistrationCard key={item?._id || item?.id || index} item={item} onCancel={cancel} onView={(id) => navigate(`/events/${id}`)} onRegisterAgain={(id) => navigate(`/events/${id}`)} />)}</div>
            </section>
          )}

          {groups.cancelled.length > 0 && (
            <section className="registration-section">
              <div className="registration-section-heading"><div><span className="section-kicker">CANCELLED</span><h2>Cancelled Registrations</h2></div><span>{groups.cancelled.length} registration{groups.cancelled.length !== 1 ? "s" : ""}</span></div>
              <div className="registration-list">{groups.cancelled.map((item, index) => <RegistrationCard key={item?._id || item?.id || index} item={item} onCancel={cancel} onView={(id) => navigate(`/events/${id}`)} onRegisterAgain={(id) => navigate(`/events/${id}`)} />)}</div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
