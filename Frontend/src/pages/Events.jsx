import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Filter, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import EventCard from "../components/EventCard";
import { getEvents } from "../services/api";

const categories = ["All", "Technical", "Cultural", "Workshop", "Seminar", "Sports", "Hackathon"];

export default function Events() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getEvents()
      .then((data) => active && setEvents(Array.isArray(data) ? data : []))
      .catch((e) => active && setError(e.message || "Unable to load events."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const now = new Date();
    return events.filter((event) => {
      const matchesCategory = category === "All" || String(event.category || "").toLowerCase().includes(category.toLowerCase());
      const haystack = [event.title, event.description, event.category, event.venue?.name || event.venue, event.organizer?.name || event.organizer].filter(Boolean);
      const matchesQuery = !q || haystack.some((v) => String(v).toLowerCase().includes(q));
      const start = new Date(event.startDate);
      const validDate = !Number.isNaN(start.getTime());
      const matchesDate = dateFilter === "all" ||
        (dateFilter === "upcoming" && (!validDate || start >= now)) ||
        (dateFilter === "thisMonth" && validDate && start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear());
      return matchesCategory && matchesQuery && matchesDate;
    });
  }, [events, query, category, dateFilter]);

  function updateSearch(value) {
    setQuery(value);
    const next = new URLSearchParams(params);
    if (value.trim()) next.set("search", value); else next.delete("search");
    setParams(next, { replace: true });
  }

  function updateCategory(value) {
    setCategory(value);
    const next = new URLSearchParams(params);
    if (value !== "All") next.set("category", value); else next.delete("category");
    setParams(next, { replace: true });
  }

  function clearFilters() {
    setQuery(""); setCategory("All"); setDateFilter("all");
    setParams({}, { replace: true });
  }

  return (
    <section className="listing-page">
      <div className="section-heading">
        <div><span className="section-kicker">EXPLORE</span><h1>Browse Events</h1><p>Discover upcoming workshops, fests, seminars and competitions.</p></div>
        <div className="event-result-count"><strong>{filtered.length}</strong> events</div>
      </div>

      <div className="listing-toolbar">
        <div className="listing-search"><Search size={17} /><input value={query} onChange={(e) => updateSearch(e.target.value)} placeholder="Search by event, category or venue..." /></div>
        <button className={`filter-btn ${showFilters ? "active" : ""}`} type="button" onClick={() => setShowFilters((v) => !v)}><SlidersHorizontal size={16} /> Filters</button>
      </div>

      <div className="category-tabs">
        {categories.map((item) => <button key={item} className={category === item ? "tab active" : "tab"} onClick={() => updateCategory(item)}>{item}</button>)}
      </div>

      {showFilters && (
        <div className="event-filter-panel">
          <div><label><CalendarDays size={14} /> Date</label><select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}><option value="all">All dates</option><option value="upcoming">Upcoming</option><option value="thisMonth">This month</option></select></div>
          <div className="filter-summary"><span><MapPin size={14} /> {category === "All" ? "All categories" : category}</span><button type="button" onClick={clearFilters}><X size={13}/> Clear filters</button></div>
        </div>
      )}

      {loading ? <div className="state-card">Loading events...</div> : error ? <div className="state-card error-state">{error}<button className="outline-btn retry-btn" onClick={() => window.location.reload()}>Retry</button></div> : filtered.length ? <div className="event-grid">{filtered.map(event => <EventCard key={event._id || event.id} event={event} />)}</div> : <div className="state-card"><strong>No events found.</strong><span>Try another search or clear your filters.</span><button className="outline-btn" onClick={clearFilters}>Clear filters</button></div>}
    </section>
  );
}
