const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const token = localStorage.getItem("ems_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}

export const getEvents = async () => {
  const data = await request("/events");
  return Array.isArray(data) ? data : data?.events || data?.data || [];
};


export const getManageEvents = async () => {
  const data = await request("/events/manage");
  return Array.isArray(data) ? data : data?.events || data?.data || [];
};

export const submitEvent = (id) =>
  request(`/events/${id}/submit`, { method: "PUT" });

export const approveEvent = (id) =>
  request(`/events/${id}/approve`, { method: "PUT" });

export const rejectEvent = (id, comment) =>
  request(`/events/${id}/reject`, { method: "PUT", body: JSON.stringify({ comment }) });

export const publishEvent = (id) =>
  request(`/events/${id}/publish`, { method: "PUT" });

export const getEventById = async (id) => {
  const data = await request(`/events/${id}`);
  return data?.event || data?.data || data;
};

export const login = (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const register = (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
export const getMe = () => request("/auth/me");

export const getDepartments = async () => {
  const data = await request("/departments");
  return data?.departments || data?.data || [];
};

export const getVenues = async () => {
  const data = await request("/venues");
  return data?.venues || data?.data || [];
};

export const createEvent = (payload) =>
  request("/events", { method: "POST", body: JSON.stringify(payload) });

export const getMyRegistrations = async () => {
  const data = await request("/registrations/my");
  const registrations = data?.registrations ?? data?.data ?? data;
  return Array.isArray(registrations) ? registrations : [];
};

export const cancelRegistration = (id) =>
  request(`/registrations/${id}/cancel`, { method: "PUT" });

export const createRegistration = (eventId) =>
  request("/registrations", { method: "POST", body: JSON.stringify({ event: eventId }) });

export const getCertificates = async () => {
  const data = await request("/certificates");
  return data?.certificates || data?.data || [];
};

export const getAnnouncements = async () => {
  const data = await request("/announcements");
  return data?.announcements || data?.data || [];
};

export const createFeedback = (payload) =>
  request("/feedback", { method: "POST", body: JSON.stringify(payload) });

export { API_URL };
