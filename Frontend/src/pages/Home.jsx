import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Search, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import { getEvents } from "../services/api";

const fallbackEvents = [
  { _id: "demo-tech", title: "TechNova 2026", category: "TECHNICAL", description: "A national-level tech fest bringing innovators, creators and problem solvers together.", startDate: "2026-09-25T10:00:00", venue: "Main Auditorium", maxParticipants: 200 },
  { _id: "demo-design", title: "Design Thinking Workshop", category: "WORKSHOP", description: "An interactive workshop on design, creativity and innovation.", startDate: "2026-09-28T10:00:00", venue: "CSE Block", maxParticipants: 100 },
  { _id: "demo-cyber", title: "Cybersecurity Seminar", category: "SEMINAR", description: "Explore modern cybersecurity and digital safety.", startDate: "2026-10-02T11:00:00", venue: "Online", maxParticipants: 150 },
  { _id: "demo-cultural", title: "Cultural Night 2026", category: "CULTURAL", description: "Music, dance and performances from the SKIT community.", startDate: "2026-10-05T18:00:00", venue: "SKIT Lawns", maxParticipants: 500 },
  { _id: "demo-ai", title: "AI for Everyone", category: "SEMINAR", description: "A beginner-friendly session on practical AI and machine learning.", startDate: "2026-10-10T10:00:00", venue: "Innovation Lab", maxParticipants: 120 },
  { _id: "demo-sports", title: "Sports Meet", category: "SPORTS", description: "A campus-wide sports experience for students.", startDate: "2026-10-12T08:00:00", venue: "Sports Ground", maxParticipants: 300 },
];

function featuredImage(event) {
  return event?.image || null;
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(data))
      .catch(() => {
        setEvents(fallbackEvents);
        setUsingFallback(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleEvents = useMemo(() => {
    const list = events.length ? events : fallbackEvents;
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((event) =>
      [event.title, event.category, event.description, event.venue?.name || event.venue]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [events, search]);

  const featured = visibleEvents[0] || fallbackEvents[0];

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> SKIT Campus Events</div>
          <h1>Welcome to<br /><span>SKIT Event Management System</span></h1>
          <p>Discover, participate and grow with exciting workshops, technical fests, seminars and campus experiences.</p>

          <form className="hero-search" onSubmit={(e) => e.preventDefault()}>
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, venues, departments..."
            />
            <Link to={`/events${search ? `?search=${encodeURIComponent(search)}` : ""}`} className="explore-btn">
              Explore
            </Link>
          </form>

          <div className="hero-stats">
            <div><strong>{events.length || 6}</strong><span>Events</span></div>
            <div><strong>4</strong><span>Roles</span></div>
            <div><strong>1</strong><span>Campus</span></div>
          </div>
        </div>

        <div className="featured-card">
          <div className="featured-top">
            <span>FEATURED THIS WEEK</span>
            <span className="live"><i /> LIVE</span>
          </div>
          <div className="featured-media">
            {featuredImage(featured) ? (
              <img src={featuredImage(featured)} alt="" />
            ) : (
              <img src="/hero.png" alt="" />
            )}
            <span className="featured-tag">{featured.category || "TECHNICAL"}</span>
          </div>
          <div className="featured-body">
            <h2>{featured.title}</h2>
            <p>{featured.description || "Discover the latest campus experience at SKIT."}</p>
            <Link to={`/events/${featured._id}`} className="text-link">View event <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="discover-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">DISCOVER</span>
            <h2>Upcoming Events</h2>
            <p>Find something worth attending at SKIT.</p>
          </div>
          <Link to="/events" className="view-all">View All <ArrowRight size={15} /></Link>
        </div>

        {loading ? (
          <div className="state-card">Loading upcoming events...</div>
        ) : (
          <div className="event-grid">
            {visibleEvents.slice(0, 6).map((event) => <EventCard key={event._id} event={event} />)}
          </div>
        )}

        {!loading && visibleEvents.length === 0 && (
          <div className="state-card">No events match your search.</div>
        )}

        {usingFallback && (
          <p className="api-note">Backend events are unavailable right now, so demo events are shown. Start the backend to load MongoDB data.</p>
        )}
      </section>

      <footer className="site-footer">
        <span>Events today. A better tomorrow.</span>
        <span>Students &nbsp;|&nbsp; Faculty &nbsp;|&nbsp; Organizers &nbsp;|&nbsp; Community</span>
      </footer>
    </div>
  );
}
