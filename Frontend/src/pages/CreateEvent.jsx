import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, Info, MapPin, Save, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent, getDepartments, getVenues } from "../services/api";

const categories = ["TECHNICAL", "CULTURAL", "SPORTS", "WORKSHOP", "SEMINAR", "HACKATHON", "COMPETITION", "OTHER"];

const initialForm = {
  title: "",
  description: "",
  category: "TECHNICAL",
  department: "",
  venue: "",
  startDate: "",
  endDate: "",
  registrationStart: "",
  registrationEnd: "",
  maxParticipants: "",
  registrationRequired: true,
  eligibility: "All Students",
  image: ""
};

function toISO(value) {
  return value ? new Date(value).toISOString() : undefined;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([getDepartments(), getVenues()])
      .then(([departmentData, venueData]) => {
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
        setVenues(Array.isArray(venueData) ? venueData : []);
      })
      .catch((e) => setError(e.message || "Unable to load departments and venues."))
      .finally(() => setLoadingOptions(false));
  }, []);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue._id === form.venue),
    [venues, form.venue]
  );

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.title.trim()) return "Event title is required.";
    if (!form.description.trim()) return "Event description is required.";
    if (!form.department) return "Please select a department.";
    if (!form.venue) return "Please select a venue.";
    if (!form.startDate || !form.endDate) return "Event start and end dates are required.";
    if (new Date(form.startDate) >= new Date(form.endDate)) return "Event start must be before event end.";
    if (form.registrationStart && form.registrationEnd && new Date(form.registrationStart) >= new Date(form.registrationEnd)) {
      return "Registration start must be before registration end.";
    }
    if (form.registrationEnd && new Date(form.registrationEnd) > new Date(form.startDate)) {
      return "Registration should close before the event starts.";
    }
    if (form.maxParticipants && (!Number.isInteger(Number(form.maxParticipants)) || Number(form.maxParticipants) < 1)) {
      return "Maximum participants must be a positive whole number.";
    }
    if (selectedVenue?.capacity && Number(form.maxParticipants) > Number(selectedVenue.capacity)) {
      return `Maximum participants cannot exceed the venue capacity of ${selectedVenue.capacity}.`;
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        department: form.department,
        venue: form.venue,
        startDate: toISO(form.startDate),
        endDate: toISO(form.endDate),
        registrationStart: toISO(form.registrationStart),
        registrationEnd: toISO(form.registrationEnd),
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
        registrationRequired: form.registrationRequired,
        eligibility: form.eligibility.trim() || "All Students",
        image: form.image.trim() || null
      };

      const result = await createEvent(payload);
      setSuccess(result?.message || "Event created successfully as a draft.");
      setTimeout(() => navigate("/organizer/events"), 900);
    } catch (e) {
      setError(e.message || "Unable to create event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="create-event-page">
      <Link to="/organizer/events" className="back-link"><ArrowLeft size={14} /> Back to My Events</Link>

      <div className="section-heading create-event-heading">
        <div>
          <span className="section-kicker">ORGANIZER</span>
          <h1>Create Event</h1>
          <p>Create your event and save it as a draft. Submission for admin approval comes next.</p>
        </div>
        <div className="draft-badge"><Save size={14} /> Saved as Draft</div>
      </div>

      {error && <div className="form-alert error-state"><Info size={16} /> <span>{error}</span></div>}
      {success && <div className="form-alert success-notice"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <form className="event-form" onSubmit={handleSubmit}>
        <div className="event-form-main">
          <section className="form-card">
            <div className="form-card-heading"><span className="form-step">01</span><div><h2>Basic Information</h2><p>Give students a clear idea of what your event is about.</p></div></div>
            <label>Event Title<input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Annual Hackathon 2026" maxLength={120} /></label>
            <label>Description<textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the event, activities, and what participants can expect..." rows={6} maxLength={2000} /><small>{form.description.length}/2000</small></label>
            <label>Category<select value={form.category} onChange={(e) => update("category", e.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </section>

          <section className="form-card">
            <div className="form-card-heading"><span className="form-step">02</span><div><h2>Schedule & Venue</h2><p>Set when and where the event will take place.</p></div></div>
            <div className="form-two-col">
              <label>Start Date & Time<div className="input-with-icon"><CalendarDays size={15} /><input type="datetime-local" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></div></label>
              <label>End Date & Time<div className="input-with-icon"><CalendarDays size={15} /><input type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></div></label>
            </div>
            <div className="form-two-col">
              <label>Department<select value={form.department} onChange={(e) => update("department", e.target.value)} disabled={loadingOptions}><option value="">{loadingOptions ? "Loading departments..." : "Select department"}</option>{departments.map((item) => <option key={item._id} value={item._id}>{item.name}{item.code ? ` (${item.code})` : ""}</option>)}</select></label>
              <label>Venue<select value={form.venue} onChange={(e) => update("venue", e.target.value)} disabled={loadingOptions}><option value="">{loadingOptions ? "Loading venues..." : "Select venue"}</option>{venues.map((item) => <option key={item._id} value={item._id}>{item.name}{item.capacity ? ` · Capacity ${item.capacity}` : ""}</option>)}</select></label>
            </div>
            {selectedVenue && <div className="venue-hint"><MapPin size={14} /><span><strong>{selectedVenue.name}</strong>{selectedVenue.building ? ` · ${selectedVenue.building}` : ""} · Capacity {selectedVenue.capacity || "N/A"}</span></div>}
          </section>

          <section className="form-card">
            <div className="form-card-heading"><span className="form-step">03</span><div><h2>Registration</h2><p>Configure how students can register for the event.</p></div></div>
            <label className="toggle-row"><span><strong>Registration Required</strong><small>Students must register before attending.</small></span><input type="checkbox" checked={form.registrationRequired} onChange={(e) => update("registrationRequired", e.target.checked)} /></label>
            {form.registrationRequired && <>
              <div className="form-two-col">
                <label>Registration Opens<div className="input-with-icon"><CalendarDays size={15} /><input type="datetime-local" value={form.registrationStart} onChange={(e) => update("registrationStart", e.target.value)} /></div></label>
                <label>Registration Closes<div className="input-with-icon"><CalendarDays size={15} /><input type="datetime-local" value={form.registrationEnd} onChange={(e) => update("registrationEnd", e.target.value)} /></div></label>
              </div>
              <div className="form-two-col">
                <label>Maximum Participants<input type="number" min="1" value={form.maxParticipants} onChange={(e) => update("maxParticipants", e.target.value)} placeholder="e.g. 100" /></label>
                <label>Eligibility<input value={form.eligibility} onChange={(e) => update("eligibility", e.target.value)} placeholder="All Students" /></label>
              </div>
            </>}
          </section>
        </div>

        <aside className="event-form-side">
          <div className="form-card workflow-card">
            <span className="section-kicker">WORKFLOW</span>
            <h2>What happens next?</h2>
            <div className="workflow-step active"><span>1</span><div><strong>Create Draft</strong><small>Your event is saved as DRAFT.</small></div></div>
            <div className="workflow-line" />
            <div className="workflow-step"><span>2</span><div><strong>Submit for Approval</strong><small>Admin reviews your event.</small></div></div>
            <div className="workflow-line" />
            <div className="workflow-step"><span>3</span><div><strong>Approval & Publish</strong><small>Approved events can be published.</small></div></div>
          </div>
          <div className="form-card tips-card"><span className="section-kicker">QUICK TIP</span><p>Make sure the venue capacity is large enough for your maximum participants. The backend validates this automatically.</p></div>
          <button className="primary-btn create-submit" type="submit" disabled={saving || loadingOptions}><Send size={15} /> {saving ? "Creating Event..." : "Create Event"}</button>
        </aside>
      </form>
    </section>
  );
}
