import { useEffect, useState } from "react";
import { Award, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getCertificates } from "../services/api";

export default function Certificates() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCertificates()
      .then((all) => setItems(all.filter((c) => String(c.user?._id || c.user) === String(user?._id || user?.id))))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  return <section className="listing-page">
    <div className="section-heading"><div><span className="section-kicker">ACHIEVEMENTS</span><h1>My Certificates</h1><p>Certificates issued to your account for eligible events.</p></div></div>
    {loading ? <div className="state-card">Loading certificates...</div> : error ? <div className="state-card error-state">{error}</div> : items.length ? <div className="certificate-grid">{items.map((c) => <article className="certificate-card" key={c._id}><div className="certificate-icon"><Award size={28}/></div><span>{c.type || "PARTICIPATION"}</span><h2>{c.event?.title || "Event Certificate"}</h2><p>Certificate No. {c.certificateNumber || "—"}</p>{c.certificateUrl && <a href={c.certificateUrl} target="_blank" rel="noreferrer">Open Certificate <ExternalLink size={13}/></a>}</article>)}</div> : <div className="state-card"><Award size={28}/><p>No certificates have been issued to you yet.</p></div>}
  </section>;
}
