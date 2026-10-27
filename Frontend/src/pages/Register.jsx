import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    phone: "",
    studentId: "",
    employeeId: ""
  });
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

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return setError("Name, email and password are required.");
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined,
        ...(form.role === "STUDENT" && form.studentId.trim() ? { studentId: form.studentId.trim() } : {}),
        ...(form.role !== "STUDENT" && form.employeeId.trim() ? { employeeId: form.employeeId.trim() } : {})
      };

      await register(payload);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        <div className="auth-form-wrap register-wrap">
          <Link to="/login" className="auth-back">← Back to Sign In</Link>
          <div className="auth-mobile-heading"><span>SKIT Event Management</span><strong>Create Account</strong></div>
          <div className="auth-heading">
            <div className="auth-icon"><UserRound size={20} /></div>
            <h2>Create Account</h2>
            <p>Join the SKIT Event Management System community</p>
          </div>

          <form className="auth-form register-form" onSubmit={handleSubmit} noValidate>
            <label>Full Name
              <div className="auth-input-wrap">
                <UserRound size={16} />
                <input value={form.name} onChange={update("name")} type="text" placeholder="Enter your full name" required />
              </div>
            </label>

            <div className="auth-two-col">
              <label>Email
                <div className="auth-input-wrap">
                  <Mail size={16} />
                  <input value={form.email} onChange={update("email")} type="email" placeholder="name@skit.ac.in" required />
                </div>
              </label>

              <label>Role
                <div className="auth-input-wrap select-wrap">
                  <UserRound size={16} />
                  <select value={form.role} onChange={update("role")}>
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="ORGANIZER">Organizer</option>
                  </select>
                </div>
              </label>
            </div>

            <div className="auth-two-col">
              {form.role === "STUDENT" ? (
                <label>Student Roll Number
                  <div className="auth-input-wrap">
                    <input value={form.studentId} onChange={update("studentId")} type="text" placeholder="e.g. 21CS001" />
                  </div>
                </label>
              ) : (
                <label>Employee ID
                  <div className="auth-input-wrap">
                    <input value={form.employeeId} onChange={update("employeeId")} type="text" placeholder="e.g. EMP001" />
                  </div>
                </label>
              )}

              <label>Phone
                <div className="auth-input-wrap">
                  <Phone size={16} />
                  <input value={form.phone} onChange={update("phone")} type="tel" placeholder="Phone number" />
                </div>
              </label>
            </div>

            <label>Password
              <div className="auth-input-wrap">
                <LockKeyhole size={16} />
                <input
                  value={form.password}
                  onChange={update("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" disabled={submitting} type="submit">
              {submitting ? "Creating Account..." : "Create Account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </section>
    </main>
  );
}

