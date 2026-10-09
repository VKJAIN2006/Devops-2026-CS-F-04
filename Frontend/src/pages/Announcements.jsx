import { useEffect, useState } from "react";
import { Bell, CalendarDays } from "lucide-react";
import { getAnnouncements } from "../services/api";

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getAnnouncements().then(setItems).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);

  return <section className="listing-page">
    <div className="section-heading"><div><span className="section-kicker">CAMPUS UPDATES</span><h1>Announcements</h1><p>Important updates visible to your role.</p></div></div>
    {loading ? <div className="state-card">Loading announcements...</div> : error ? <div className="state-card error-state">{error}</div> : items.length ? <div className="announcement-list">{items.map((item) => <article className="announcement-card" key={item._id}><div className="announcement-icon"><Bell size={19}/></div><div><div className="announcement-top"><span className={`priority ${String(item.priority || "NORMAL").toLowerCase()}`}>{item.priority || "NORMAL"}</span><small>{item.createdAt ? new Intl.DateTimeFormat("en-IN",{dateStyle:"medium"}).format(new Date(item.createdAt)) : ""}</small></div><h2>{item.title}</h2><p>{item.message}</p>{item.event?.title && <span className="announcement-event"><CalendarDays size={13}/> {item.event.title}</span>}</div></article>)}</div> : <div className="state-card"><Bell size={28}/><p>No announcements available right now.</p></div>}
  </section>;
}
