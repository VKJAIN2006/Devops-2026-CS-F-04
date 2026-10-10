import { useEffect, useMemo, useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { approveEvent, getManageEvents, rejectEvent } from "../services/api";

const statuses = ["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PUBLISHED", "DRAFT"];
const pretty = (v) => String(v || "").replaceAll("_", " ");
const fmt = (v) => v ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v)) : "—";

export default function AdminApprovals() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setEvents(await getManageEvents()); }
    catch (e) { setError(e.message || "Unable to load approval queue."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => Object.fromEntries(statuses.slice(1).map(s => [s, events.filter(e => e.status === s).length])), [events]);
  const filtered = useMemo(() => status === "ALL" ? events : events.filter(e => e.status === status), [events, status]);

  async function approve() {
    if (!selected) return;
    setWorking(true); setError(""); setMessage("");
    try { await approveEvent(selected._id); setMessage("Event approved successfully."); setSelected(null); await load(); }
    catch (e) { setError(e.message || "Unable to approve event."); }
    finally { setWorking(false); }
  }

  async function reject() {
    if (!selected) return;
    setWorking(true); setError(""); setMessage("");
    try { await rejectEvent(selected._id, comment.trim()); setMessage("Event rejected successfully."); setSelected(null); setComment(""); await load(); }
    catch (e) { setError(e.message || "Unable to reject event."); }
    finally { setWorking(false); }
  }

  return <section className="organizer-events-page">
    <div className="section-heading">
      <div><span className="section-kicker">ADMIN</span><h1>Event Approvals</h1><p>Review organizer submissions before they can be published.</p></div>
    </div>
    {message && <div className="form-alert success-notice">{message}</div>}
    {error && <div className="form-alert error-state">{error}</div>}
    <div className="admin-approval-stats">
      {statuses.slice(1).map(s => <button key={s} className={`approval-stat ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}><strong>{counts[s] || 0}</strong><span>{pretty(s)}</span></button>)}
    </div>
    <div className="organizer-toolbar"><select value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
    {loading ? <div className="state-card">Loading approval queue...</div> : filtered.length === 0 ? <div className="state-card"><strong>No events in this status</strong><span>New submissions will appear here after organizers submit them for approval.</span></div> : <div className="organizer-event-list">{filtered.map(e => <article className="organizer-event-card" key={e._id}><div className="organizer-event-main"><div className="organizer-event-date"><span>{fmt(e.startDate)}</span></div><h2>{e.title}</h2><p>{e.description}</p><div className="organizer-event-meta"><span>{pretty(e.status)}</span><span>{e.organizer?.name || e.organizer?.email || "Organizer"}</span><span>{e.department?.code || e.department?.name || "Department"}</span><span>{e.venue?.name || "Venue"}</span></div></div><div className="organizer-event-side"><span className={`status-pill ${String(e.status || "").toLowerCase()}`}>{pretty(e.status)}</span><button className="view-registration-btn" onClick={() => { setSelected(e); setComment(e.approval?.comment || ""); }}><Eye size={13}/> Review</button></div></article>)}</div>}

    {selected && <div className="approval-overlay" onClick={() => !working && setSelected(null)}><div className="approval-modal" onClick={e => e.stopPropagation()}><div className="section-heading"><div><span className="section-kicker">REVIEW EVENT</span><h2>{selected.title}</h2><p>{selected.description}</p></div><button className="icon-btn" onClick={() => setSelected(null)}><X size={18}/></button></div><div className="approval-details"><div><strong>Organizer</strong><span>{selected.organizer?.name} · {selected.organizer?.email}</span></div><div><strong>Department</strong><span>{selected.department?.name || "—"}</span></div><div><strong>Venue</strong><span>{selected.venue?.name || "—"} · Capacity {selected.venue?.capacity || "—"}</span></div><div><strong>Event</strong><span>{fmt(selected.startDate)} → {fmt(selected.endDate)}</span></div><div><strong>Registration</strong><span>{fmt(selected.registrationStart)} → {fmt(selected.registrationEnd)}</span></div><div><strong>Max Participants</strong><span>{selected.maxParticipants || "—"}</span></div><div><strong>Eligibility</strong><span>{selected.eligibility || "All Students"}</span></div><div><strong>Status</strong><span>{pretty(selected.status)}</span></div></div>{selected.status === "PENDING_APPROVAL" && <label className="approval-comment"><strong>Rejection reason (optional)</strong><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Explain what needs to be changed..." /></label>}<div className="approval-actions">{selected.status === "PENDING_APPROVAL" && <><button className="outline-btn" disabled={working} onClick={reject}><X size={15}/> Reject</button><button className="primary-btn" disabled={working} onClick={approve}><Check size={15}/> Approve</button></>}{selected.status !== "PENDING_APPROVAL" && <button className="outline-btn" onClick={() => setSelected(null)}>Close</button>}</div></div></div>}
  </section>;
}
