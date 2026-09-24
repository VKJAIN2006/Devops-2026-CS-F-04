const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Attendance = require("../database/Attendance");
const Registration = require("../database/Registration");
const User = require("../database/User");
const Event = require("../database/Event");


// ============================================================
// Constants & helpers
// ============================================================

const VALID_STATUSES = ["PRESENT", "ABSENT"];
const VALID_METHODS = ["MANUAL", "QR"];

// Events must be open (published/ongoing) to accept attendance
const OPEN_EVENT_STATUSES = ["PUBLISHED", "ONGOING"];

// Attendance can be marked while the event is running and for up to
// ATENDANCE_GRACE_MS after it ends (post-event head count / late entry).
const ATTENDANCE_GRACE_MS = 60 * 60 * 1000; // 1 hour

const QR_SCOPE = "attendance-qr";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanString = (value) =>
  typeof value === "string" ? value.trim() : value;

// Is the event currently inside the markable window?
const isWithinAttendanceWindow = (event, now = new Date()) => {
  if (!event.startDate || !event.endDate) {
    return false;
  }
  const start = new Date(event.startDate);
  const end = new Date(event.endDate).getTime() + ATTENDANCE_GRACE_MS;
  return now >= start && now.getTime() <= end;
};

// Who may manage attendance for a given event?
//   ADMIN     -> any event
//   ORGANIZER -> only events they organize
//   FACULTY   -> only events of their own department (event staff)
// Returns true/false - explicitly scoped, never "everyone".
const canManageEvent = (user, event) => {
  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role === "ORGANIZER") {
    return (
      event.organizer &&
      event.organizer.toString() === user._id.toString()
    );
  }

  if (user.role === "FACULTY") {
    return Boolean(
      event.department &&
      user.department &&
      event.department.toString() === user.department.toString()
    );
  }

  return false;
};

// Signed QR ticket - identifies { userId, eventId } without trusting
// any client-supplied value at verification time.
const signAttendanceQRTicket = (userId, eventId) =>
  jwt.sign(
    {
      scope: QR_SCOPE,
      userId: userId.toString(),
      eventId: eventId.toString()
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );


// ============================================================
// Mark attendance (manual by event staff / admin)
// Route: POST /api/attendance
// ============================================================
const markAttendance = async (req, res) => {
  try {
    const user = cleanString(req.body.user);
    const event = cleanString(req.body.event);
    const status = cleanString(req.body.status);
    const method = cleanString(req.body.method);

    // 1. Required fields + format
    if (!user || !event) {
      return res.status(400).json({
        message: "User and event are required"
      });
    }

    if (!isValidObjectId(user) || !isValidObjectId(event)) {
      return res.status(400).json({
        message: "Invalid user or event ID format"
      });
    }

    // 2. Users / events must exist
    const [existingUser, existingEvent] = await Promise.all([
      User.findById(user),
      Event.findById(event)
    ]);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!existingEvent) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // 3. Event must be open (not DRAFT / CANCELLED / COMPLETED / ...)
    if (!OPEN_EVENT_STATUSES.includes(existingEvent.status)) {
      return res.status(400).json({
        message: `Attendance cannot be marked. Event is not open (status: ${existingEvent.status})`
      });
    }

    // 4. Only authorized event staff may mark (ownership scoping)
    if (!canManageEvent(req.user, existingEvent)) {
      return res.status(403).json({
        message: "Access denied. You can only manage attendance for events you are authorized for"
      });
    }

    // 5. Event must be in progress (with post-event grace period)
    if (!isWithinAttendanceWindow(existingEvent)) {
      return res.status(400).json({
        message: "Attendance can only be marked while the event is in progress (within 1 hour after it ends)"
      });
    }

    // 6. User must have a confirmed registration
    const registration = await Registration.findOne({
      user,
      event,
      status: "REGISTERED"
    });

    if (!registration) {
      return res.status(400).json({
        message: "User is not registered for this event"
      });
    }

    // 7. No duplicate attendance (app-level check + DB unique index)
    const existingAttendance = await Attendance.findOne({
      user,
      event
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance has already been marked for this user"
      });
    }

    // 8. Validate controlled fields
    const finalStatus = status || "PRESENT";
    const finalMethod = method || "MANUAL";

    if (!VALID_STATUSES.includes(finalStatus)) {
      return res.status(400).json({
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`
      });
    }

    if (!VALID_METHODS.includes(finalMethod)) {
      return res.status(400).json({
        message: `method must be one of: ${VALID_METHODS.join(", ")}`
      });
    }

    // 9. Create attendance record (staff identity always from JWT)
    const attendance = await Attendance.create({
      user,
      event,
      registration: registration._id,
      status: finalStatus,
      markedBy: req.user._id,
      method: finalMethod
    });

    // Populate useful information
    const populatedAttendance = await Attendance.findById(
      attendance._id
    )
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("registration")
      .populate("markedBy", "name email role");

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance: populatedAttendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error marking attendance",
      error: error.message
    });
  }
};


// ============================================================
// Get attendance records for the logged-in user (self-view)
// Route: GET /api/attendance/my
// ============================================================
const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      user: req.user._id
    })
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .sort({ markedAt: -1 });

    res.status(200).json({
      count: attendance.length,
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching your attendance",
      error: error.message
    });
  }
};


// ============================================================
// Get all attendance records
// Route: GET /api/attendance
// ADMIN -> all events; ORGANIZER -> only their own events
// ============================================================
const getAttendance = async (req, res) => {
  try {
    let attendance;

    if (req.user.role === "ADMIN") {
      attendance = await Attendance.find();
    } else {
      // ORGANIZER: scope to events they organize
      const ownedEvents = await Event.find({
        organizer: req.user._id
      }).select("_id");

      attendance = await Attendance.find({
        event: { $in: ownedEvents.map((e) => e._id) }
      });
    }

    const populated = await Attendance.populate(attendance, [
      { path: "user", select: "name email role" },
      { path: "event", select: "title category startDate endDate" },
      { path: "registration" },
      { path: "markedBy", select: "name email role" }
    ]);

    res.status(200).json({
      count: populated.length,
      attendance: populated
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance",
      error: error.message
    });
  }
};


// ============================================================
// Get attendance by ID
// Route: GET /api/attendance/:id
// Allowed: the record's owner, ADMIN, or authorized event staff
// ============================================================
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    // Self-view is always allowed
    const isOwner = attendance.user.toString() === req.user._id.toString();

    if (!isOwner) {
      const event = await Event.findById(attendance.event);

      if (!canManageEvent(req.user, event)) {
        return res.status(403).json({
          message: "Access denied. You can only view attendance records you own or are authorized for"
        });
      }
    }

    const populatedAttendance = await Attendance.findById(
      attendance._id
    )
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("registration")
      .populate("markedBy", "name email role");

    res.status(200).json({
      attendance: populatedAttendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance",
      error: error.message
    });
  }
};


// ============================================================
// Generate a QR ticket for the logged-in user + event (self-service)
// Route: GET /api/attendance/qr/:eventId
// The ticket is a short-lived signed JWT. Students present it to
// event staff, who scan/verify it (POST /api/attendance/verify).
// ============================================================
const getQRTicket = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // Only for users with a confirmed registration
    const registration = await Registration.findOne({
      user: req.user._id,
      event: eventId,
      status: "REGISTERED"
    });

    if (!registration) {
      return res.status(400).json({
        message: "You must be registered for this event to generate a QR ticket"
      });
    }

    const token = signAttendanceQRTicket(req.user._id, eventId);

    res.status(200).json({
      message: "QR ticket generated",
      token,
      eventId,
      expiresIn: "24h"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error generating QR ticket",
      error: error.message
    });
  }
};


// ============================================================
// Verify a QR ticket and mark attendance (staff scan)
// Route: POST /api/attendance/verify
// The userId/eventId come ONLY from the signed ticket - the request
// body cannot tamper with who is being marked.
// ============================================================
const verifyQRAttendance = async (req, res) => {
  try {
    const { token } = req.body || {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "QR token is required"
      });
    }

    // 1. Verify signature - reject forged/expired tickets
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid or expired QR token"
      });
    }

    if (payload.scope !== QR_SCOPE || !payload.userId || !payload.eventId) {
      return res.status(400).json({
        message: "Invalid QR token payload"
      });
    }

    const { userId, eventId } = payload;

    if (!isValidObjectId(userId) || !isValidObjectId(eventId)) {
      return res.status(400).json({
        message: "Invalid QR token contents"
      });
    }

    // 2. Event must exist and be open
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (!OPEN_EVENT_STATUSES.includes(event.status)) {
      return res.status(400).json({
        message: `Attendance cannot be marked. Event is not open (status: ${event.status})`
      });
    }

    // 3. Only authorized staff may perform the scan
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Access denied. You can only verify attendance for events you are authorized for"
      });
    }

    // 4. Event must be in progress
    if (!isWithinAttendanceWindow(event)) {
      return res.status(400).json({
        message: "Attendance can only be verified while the event is in progress"
      });
    }

    // 5. User must exist and be registered
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const registration = await Registration.findOne({
      user: userId,
      event: eventId,
      status: "REGISTERED"
    });

    if (!registration) {
      return res.status(400).json({
        message: "User is not registered for this event"
      });
    }

    // 6. One scan per user per event
    const existingAttendance = await Attendance.findOne({
      user: userId,
      event: eventId
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance has already been marked for this user"
      });
    }

    // 7. Create the attendance record (method QR, scanner = markedBy)
    const attendance = await Attendance.create({
      user: userId,
      event: eventId,
      registration: registration._id,
      status: "PRESENT",
      markedBy: req.user._id,
      method: "QR"
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("registration")
      .populate("markedBy", "name email role");

    res.status(201).json({
      message: "Attendance verified via QR",
      attendance: populatedAttendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error verifying QR attendance",
      error: error.message
    });
  }
};


// ============================================================
// Update attendance status (correct mistakes, by staff/admin)
// Route: PUT /api/attendance/:id
// Keeps the original markedBy, records updatedBy + updateReason.
// ============================================================
const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    // Staff scoping: organizer owns the event / faculty matches department
    const event = await Event.findById(attendance.event);

    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Access denied. You can only update attendance for events you are authorized for"
      });
    }

    const status = cleanString(req.body.status);
    const reason = cleanString(req.body.reason);

    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`
      });
    }

    // Audit: keep who marked it, record who corrected it
    attendance.status = status;
    attendance.updatedBy = req.user._id;
    attendance.updateReason = reason || null;

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("registration")
      .populate("markedBy", "name email role")
      .populate("updatedBy", "name email role");

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance: populatedAttendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating attendance",
      error: error.message
    });
  }
};


module.exports = {
  markAttendance,
  getMyAttendance,
  getAttendance,
  getAttendanceById,
  getQRTicket,
  verifyQRAttendance,
  updateAttendance
};