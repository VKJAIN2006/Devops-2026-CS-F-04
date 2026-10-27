import { Building2, IdCard, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <section className="profile-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">ACCOUNT</span>
          <h1>My Profile</h1>
          <p>View your account and organization details.</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-hero">
          <div className="profile-big-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user?.name || "User"}</h2>
            <span>{user?.role || "STUDENT"}</span>
          </div>
        </div>

        <div className="profile-details">
          <div>
            <Mail size={20} />
            <div>
              <small>Email Address</small>
              <strong>{user?.email || "—"}</strong>
            </div>
          </div>

          <div>
            <ShieldCheck size={20} />
            <div>
              <small>Account Role</small>
              <strong>{user?.role || "STUDENT"}</strong>
            </div>
          </div>

          <div>
            <IdCard size={20} />
            <div>
              <small>{user?.role === "STUDENT" ? "Student Roll No" : "Employee ID"}</small>
              <strong>{user?.studentId || user?.employeeId || "—"}</strong>
            </div>
          </div>

          <div>
            <Phone size={20} />
            <div>
              <small>Phone Number</small>
              <strong>{user?.phone || "—"}</strong>
            </div>
          </div>

          <div>
            <Building2 size={20} />
            <div>
              <small>Department</small>
              <strong>{user?.department?.name || user?.department || "General"}</strong>
            </div>
          </div>

          <div>
            <User size={20} />
            <div>
              <small>Account Status</small>
              <strong>{user?.isActive !== false ? "Active" : "Inactive"}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

