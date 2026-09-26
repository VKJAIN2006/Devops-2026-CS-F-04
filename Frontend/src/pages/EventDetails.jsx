import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, Users, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createRegistration, getEventById, getMyRegistrations } from "../services/api";

function formatDate(value) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date TBA" : date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(value) {
  if (!value) return "Time TBA";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time TBA" : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registered, setRegistered] = useState(false);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  useEffect(() => {
    let active = true;
    getEventById(id).then((data) => active && setEvent(data)).catch((e) => active && setError(e.message || "Unable to load this event."));
    if (isAuthenticated) {
      getMyRegistrations().then((items) => {
        if (!active) return;
        setRegistered(items.some((r) => String(r.event?._id || r.event?.id || r.eventId || r.event) === String(id) && String(r.status || "").toLowerCase() !== "cancelled"));
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [id, isAuthenticated]);

  const venue = typeof event?.venue === "object" ? event?.venue?.name : event?.venue;
  const seats = event?.maxParticipants ? Number(event.maxParticipants) : null;
  const remaining = event?.remainingSeats ?? event?.availableSeats ?? null;
  const start = event?.startDate ? new Date(event.startDate) : null;
  const end = event?.endDate ? new Date(event.endDate) : null;
  const past = start && !Number.isNaN(start.getTime()) && start < new Date();
  const capacityText = remaining != null ? `${remaining} seats left` : seats ? `${seats} seats` : "Open registration";
  const registeredCount = Number(event?.registeredCount || 0);
  const registrationDate = new Date().toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
const studentName = user?.name || user?.email || "Student";
  const description = event?.description || "Event details will be available soon. Please check back for updates from the organizer.";
  const paragraphs = useMemo(() => description.split(/\n+/).filter(Boolean), [description]);

  function handleRegisterClick() {
  if (!isAuthenticated) {
    navigate("/login", { state: { from: `/events/${id}` } });
    return;
  }

  if (registered || past) return;

  setRegistrationMessage("");
  setShowRegistrationModal(true);
}

async function confirmRegistration() {
  if (!isAuthenticated || registered || past) return;

  try {
    setRegistering(true);
    setRegistrationMessage("");

    await createRegistration(id);

    setRegistered(true);
    setShowRegistrationModal(false);

    setRegistrationMessage(
      "You're registered! Your registration is now available under My Registrations."
    );

    setEvent((current) =>
      current
        ? {
            ...current,
            registeredCount: Number(current.registeredCount || 0) + 1
          }
        : current
    );
  } catch (e) {
    setRegistrationMessage(
      e.message || "Registration could not be completed."
    );
  } finally {
    setRegistering(false);
  }
}

  if (error) return <section className="detail-page"><Link to="/events" className="back-link"><ArrowLeft size={16}/> Back to Events</Link><div className="state-card error-state">{error}<Link className="outline-btn" to="/events">Browse Events</Link></div></section>;
  if (!event) return <section className="detail-page"><Link to="/events" className="back-link"><ArrowLeft size={16}/> Back to Events</Link><div className="state-card">Loading event...</div></section>;

  return (
    <section className="detail-page">
      <Link to="/events" className="back-link"><ArrowLeft size={16} /> Back to Events</Link>
      <div className="detail-card phase4-detail-card">
        <div className="detail-visual"><img src={event.image || "/hero.png"} alt={event.title || "Event"} /><span>{event.category || "EVENT"}</span></div>
        <div className="detail-copy">
          <span className="event-category">{event.category || "Campus Event"}</span>
          <h1>{event.title || "Untitled Event"}</h1>
          <div className="detail-meta">
            <span><CalendarDays size={17}/>{formatDate(event.startDate)}</span>
            <span><Clock3 size={17}/>{formatTime(event.startDate)}{end && !Number.isNaN(end.getTime()) ? ` - ${formatTime(event.endDate)}` : ""}</span>
            <span><MapPin size={17}/>{venue || "Venue TBA"}</span>
            <span><Users size={17}/>{capacityText}</span>
          </div>
          <div className="detail-description">
            <h2>About this event</h2>
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          {event.organizer && <div className="organizer-box"><strong>Organized by</strong><span>{typeof event.organizer === "object" ? event.organizer.name || event.organizer.email : event.organizer}</span></div>}
          <div className="detail-actions">
            <button className="primary-btn" type="button" disabled={registering || registered || past} onClick={handleRegisterClick}>{registered ? <><CheckCircle2 size={15}/> Registered</> : registering ? "Registering..." : past ? "Event Completed" : "Register Now"}</button>
            <Link className="outline-btn" to="/events">Continue Browsing</Link>
          </div>
          {registrationMessage && <div className={`notice-box ${registered ? "success-notice" : ""}`}>{registrationMessage}</div>}
        </div>
      </div>
      {showRegistrationModal && (
  <div
    className="registration-modal-overlay"
    role="presentation"
    onMouseDown={() =>
      !registering && setShowRegistrationModal(false)
    }
  >
    <div
      className="registration-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-confirmation-title"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        className="registration-modal-close"
        type="button"
        aria-label="Close"
        onClick={() =>
          !registering && setShowRegistrationModal(false)
        }
        disabled={registering}
      >
        <X size={18} />
      </button>

      <div className="registration-modal-header">
        <span className="registration-modal-kicker">
          REGISTRATION CONFIRMATION
        </span>

        <h2 id="registration-confirmation-title">
          Confirm your registration
        </h2>

        <p>
          Please review your details before registering for this event.
        </p>
      </div>

      <div className="registration-summary">
        <div className="registration-summary-row">
          <span>Student Name</span>
          <strong>{studentName}</strong>
        </div>

        <div className="registration-summary-row">
          <span>Registration Date</span>
          <strong>{registrationDate}</strong>
        </div>

        <div className="registration-summary-row">
          <span>People Registered</span>
          <strong>
            {seats ? `${registeredCount} / ${seats}` : registeredCount}
          </strong>
        </div>
      </div>

      {registrationMessage && !registered && (
        <div className="notice-box error-notice">
          {registrationMessage}
        </div>
      )}

      <div className="registration-modal-actions">
        <button
          className="outline-btn"
          type="button"
          onClick={() =>
            !registering && setShowRegistrationModal(false)
          }
          disabled={registering}
        >
          Cancel
        </button>

        <button
          className="primary-btn registration-confirm-btn"
          type="button"
          onClick={confirmRegistration}
          disabled={registering}
        >
          {registering ? "Registering..." : "Register"}
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}
