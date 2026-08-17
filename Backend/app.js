const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const departmentRoutes = require("./routes/departmentRoutes");
const venueRoutes = require("./routes/venueRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const announcementRoutes = require("./routes/announcementRoutes");

const app = express();

app.use(cors());
app.use(express.json());

require("./models/User");
require("./models/Department");
require("./models/Venue");
require("./models/Event");
require("./models/Registration");
require("./models/Attendance");
require("./models/Certificate");
require("./models/Feedback");
require("./models/Announcement");

app.use("/api/departments", departmentRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/announcements", announcementRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Event Management System Backend is running"
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});