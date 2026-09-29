import { CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

function formatDate(value) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function venueName(venue) {
  if (!venue) return "Venue TBA";
  return typeof venue === "object" ? venue.name || "Venue TBA" : venue;
}

function categoryClass(category = "") {
  const c = category.toLowerCase();
  if (c.includes("work")) return "workshop";
  if (c.includes("seminar")) return "seminar";
  if (c.includes("cultur")) return "cultural";
  if (c.includes("sport")) return "sports";
  if (c.includes("hack")) return "hackathon";
  return "technical";
}

export default function EventCard({ event }) {
  const image = event.image;
  return (
    <article className="event-card">
      <div className={`event-thumb ${categoryClass(event.category)}`}>
        {image ? (
          <img src={image} alt="" />
        ) : (
          <div className="thumb-pattern">
            <span>{event.category || "EVENT"}</span>
          </div>
        )}
        <span className="bookmark-dot">♡</span>
      </div>

      <div className="event-card-body">
        <div className="event-card-title-row">
          <div>
            <span className="event-category">{event.category || "Campus Event"}</span>
            <h3>{event.title || "Untitled Event"}</h3>
          </div>
        </div>

        <div className="event-meta">
          <span><CalendarDays size={13} />{formatDate(event.startDate)}</span>
          <span><MapPin size={13} />{venueName(event.venue)}</span>
        </div>

        <div className="event-card-footer">
          <span className="seat-count">
            <Users size={13} />
            {event.maxParticipants ? `${event.maxParticipants} seats` : "Open"}
          </span>
          <Link className="outline-btn" to={`/events/${event._id}`}>View Details</Link>
        </div>
      </div>
    </article>
  );
}
