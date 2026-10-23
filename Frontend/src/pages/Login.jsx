import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", role: "STUDENT" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const update = (field) => (e) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) return setError("Email and password are required.");
    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password, role: form.role });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <img src="/hero.png" alt="SKIT campus" className="auth-campus-image" />
        <div className="auth-brand-overlay" />
        <div className="auth-brand-content">
          <img src="/skit-logo.png" alt="SKIT logo" className="auth-logo-image" />
          <p className="auth-institute">Swami Keshvanand Institute of Technology, Management & Gramothan, Jaipur</p>
          <div className="auth-title-block">
            <span>EVENT</span>
            <h1>Management<br />System</h1>
            <p>Connect. Participate. Grow.</p>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-back">← Back to events</Link>
          <div className="auth-mobile-heading"><span>SKIT Event Management</span><strong>Welcome Back</strong></div>
          <div className="auth-heading">
            <div className="auth-icon"><UserRound size={20} /></div>
            <h2>Welcome Back</h2>
            <p>Sign in to continue to the Event Management System</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label>Email / Roll Number
              <div className="auth-input-wrap"><Mail size={16} /><input value={form.email} onChange={update("email")} type="email" autoComplete="username" placeholder="Enter your email" /></div>
            </label>
            <label>Role
              <div className="auth-input-wrap select-wrap"><UserRound size={16} /><select value={form.role} onChange={update("role")} aria-label="Login role"><option value="STUDENT">Student</option><option value="FACULTY">Faculty</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select></div>
            </label>
            <label>Password
              <div className="auth-input-wrap"><LockKeyhole size={16} /><input value={form.password} onChange={update("password")} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            </label>
            <div className="auth-options"><span /> <button type="button" className="forgot-btn" onClick={() => setError("Password reset is not available in the current backend yet.")}>Forgot Password?</button></div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-submit" disabled={submitting} type="submit">{submitting ? "Signing In..." : "Sign In"}<ArrowRight size={16} /></button>
          </form>

          <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
          <p className="auth-quote">“Great events build greater communities.”</p>
        </div>
      </section>
    </main>
  );
}
