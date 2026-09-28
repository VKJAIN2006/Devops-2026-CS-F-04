import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <Link to="/" className="brand brand-link" aria-label="SKIT Event Management home">
      <img src="/skit-logo.png" alt="SKIT logo" className="brand-logo" />
      <div>
        <div className="brand-name">SKIT</div>
        <div className="brand-subtitle">Swami Keshvanand Institute of Technology</div>
      </div>
    </Link>
  );
}
