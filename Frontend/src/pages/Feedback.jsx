import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { createFeedback, getMyRegistrations } from "../services/api";

export default function Feedback() {
  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getMyRegistrations().then(setRegistrations).catch(e => setStatus(e.message)).finally(() => setLoading(false)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!event) return setStatus("Please select an event.");
    try {
      await createFeedback({ event, rating: Number(rating), comment, isAnonymous: anonymous });
      setStatus("Feedback submitted successfully.");
      setComment("");
    } catch (err) { setStatus(err.message); }
  };

  return <section className="listing-page">
    <div className="section-heading"><div><span className="section-kicker">YOUR VOICE</span><h1>Feedback</h1><p>Share feedback after attending an event.</p></div></div>
    <div className="feedback-card">
      <div className="feedback-intro"><div className="certificate-icon"><MessageSquare size={25}/></div><h2>Tell us about your experience</h2><p>The backend accepts feedback only from participants whose attendance is marked PRESENT.</p></div>
      <form onSubmit={submit} className="feedback-form">
        <label>Event<select value={event} onChange={e => setEvent(e.target.value)} disabled={loading}><option value="">Select an event</option>{registrations.filter(r => r.status !== "CANCELLED" && r.event).map(r => <option key={r._id} value={r.event._id}>{r.event.title}</option>)}</select></label>
        <label>Rating<select value={rating} onChange={e => setRating(e.target.value)}><option value="5">5 — Excellent</option><option value="4">4 — Very Good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></label>
        <label>Comment<textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us what you thought..." rows="5" /></label>
        <label className="checkbox-row"><input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} /> Submit anonymously</label>
        {status && <div className="notice-box">{status}</div>}
        <button className="primary-btn" type="submit"><Send size={15}/> Submit Feedback</button>
      </form>
    </div>
  </section>;
}
