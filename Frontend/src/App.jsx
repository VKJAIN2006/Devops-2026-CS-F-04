import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyRegistrations from "./pages/MyRegistrations";
import Certificates from "./pages/Certificates";
import Feedback from "./pages/Feedback";
import Announcements from "./pages/Announcements";
import Profile from "./pages/Profile";
import CreateEvent from "./pages/CreateEvent";
import OrganizerEvents from "./pages/OrganizerEvents";
import AdminApprovals from "./pages/AdminApprovals";

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function OrganizerOnly({ children }) {
  return <ProtectedRoute roles={["ORGANIZER", "ADMIN"]}>{children}</ProtectedRoute>;
}

function AdminOnly({ children }) {
  return <ProtectedRoute roles={["ADMIN"]}>{children}</ProtectedRoute>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/registrations" element={<Protected><MyRegistrations /></Protected>} />
            <Route path="/certificates" element={<Protected><Certificates /></Protected>} />
            <Route path="/feedback" element={<Protected><Feedback /></Protected>} />
            <Route path="/announcements" element={<Protected><Announcements /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/organizer/events" element={<OrganizerOnly><OrganizerEvents /></OrganizerOnly>} />
            <Route path="/organizer/events/create" element={<OrganizerOnly><CreateEvent /></OrganizerOnly>} />
            <Route path="/admin/approvals" element={<AdminOnly><AdminApprovals /></AdminOnly>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
