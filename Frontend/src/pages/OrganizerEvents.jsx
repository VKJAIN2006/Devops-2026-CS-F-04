import { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, Plus, Send, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { getManageEvents, publishEvent, submitEvent } from "../services/api";

const statuses = ["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED"];
const fmt = (v) =>
  v
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(v))
    : "—";

export default function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setEvents(await getManageEvents());
    } catch (e) {
      setError(e.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (status === "ALL" ? events : events.filter((e) => e.status === status)),
    [events, status]
  );

  const handleSubmitForApproval = async (id) => {
    setWorkingId(id);
    setMessage("");
    setError("");
    try {
      await submitEvent(id);
      setMessage("Event submitted for admin approval.");
      await load();
    } catch (e) {
      setError(e.message || "Failed to submit event.");
    } finally {
      setWorkingId(null);
    }
  };

  const handlePublish = async (id) => {
    setWorkingId(id);
    setMessage("");
    setError("");
    try {
      await publishEvent(id);
      setMessage("Event published successfully.");
      await load();
    } catch (e) {
      setError(e.message || "Failed to publish event.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="organizer-events-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">ORGANIZER</span>
          <h1>My Organized Events</h1>
          <p>Manage and track the status of events you have organized.</p>
        </div>
        <Link to="/organizer/events/create" className="primary-btn">
          <Plus size={16} /> Create New Event
        </Link>
      </div>

      {message && <div className="form-alert success-notice">{message}</div>}
      {error && <div className="form-alert error-notice">{error}</div>}

      <div className="organizer-toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              Status: {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading-note">Loading events...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No events found for this filter.</p>
        </div>
      ) : (
        <div className="organizer-event-list">
          {filtered.map((item) => (
            <div key={item._id} className="organizer-event-card">
              <div className="organizer-event-main">
                <div className="organizer-event-date">
                  <Calendar size={14} />
                  <span>{fmt(item.startDate || item.date)}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <div className="organizer-event-meta">
                  <span>Category: {item.category || "General"}</span>
                  <span>Venue: {item.venue?.name || item.venue || "TBA"}</span>
                  <span>Max Seats: {item.capacity || item.maxSeats || "Open"}</span>
                  <span className={`status-pill status-${(item.status || "DRAFT").toLowerCase()}`}>
                    {(item.status || "DRAFT").replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <div className="organizer-event-side">
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link to={`/events/${item._id}`} className="view-registration-btn">
                    <Eye size={14} /> View
                  </Link>

                  {item.status === "DRAFT" && (
                    <button
                      className="register-again-btn"
                      disabled={workingId === item._id}
                      onClick={() => handleSubmitForApproval(item._id)}
                    >
                      <Send size={14} /> Submit
                    </button>
                  )}

                  {item.status === "APPROVED" && (
                    <button
                      className="register-again-btn"
                      disabled={workingId === item._id}
                      onClick={() => handlePublish(item._id)}
                    >
                      <Upload size={14} /> Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

