const mongoose = require("mongoose");
const Event = require("../database/Event");
const Department = require("../database/Department");
const Venue = require("../database/Venue");
const Registration = require("../database/Registration");


// ==========================================
// Constants
// ==========================================

const CATEGORIES = [
  "TECHNICAL",
  "CULTURAL",
  "SPORTS",
  "WORKSHOP",
  "SEMINAR",
  "HACKATHON",
  "COMPETITION",
  "OTHER"
];

// Fields a general update is allowed to change.
// organizer, status and approval are NEVER editable through PUT /:id
// - organizer is always the creator from the JWT
// - status/approval are managed only through the approval workflow endpoints
const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "department",
  "venue",
  "startDate",
  "endDate",
  "registrationStart",
  "registrationEnd",
  "maxParticipants",
  "registrationRequired",
  "eligibility",
  "image"
];

const PROTECTED_FIELDS = ["organizer", "status", "approval"];


// ==========================================
// Helpers
// ==========================================

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const parseDate = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const populateEvent = (query) =>
  query
    .populate("organizer", "name email role")
    .populate("department", "name code")
    .populate("venue", "name building capacity");


// ==========================================
// Create event
// ORGANIZER / ADMIN only - protected in routes.
// Creator is always taken from the JWT (never from the request body).
// New events always start in DRAFT status.
// ==========================================
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      department,
      venue,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      maxParticipants,
      registrationRequired,
      eligibility,
      image
    } = req.body;

    // Creator comes from the authenticated user (security: ignore organizer in body)
    const organizer = req.user._id;

    // ========== Required fields ==========
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "category must be one of: TECHNICAL, CULTURAL, SPORTS, WORKSHOP, SEMINAR, HACKATHON, COMPETITION, OTHER"
      });
    }

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    if (!venue) {
      return res.status(400).json({ message: "Venue is required" });
    }

    if (!startDate) {
      return res.status(400).json({ message: "Start date is required" });
    }

    if (!endDate) {
      return res.status(400).json({ message: "End date is required" });
    }

    // ========== ObjectId format checks ==========
    if (!isValidObjectId(department)) {
      return res.status(400).json({ message: "Invalid department ID format" });
    }

    if (!isValidObjectId(venue)) {
      return res.status(400).json({ message: "Invalid venue ID format" });
    }

    // ========== Date validation ==========
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start) {
      return res.status(400).json({ message: "Invalid startDate" });
    }

    if (!end) {
      return res.status(400).json({ message: "Invalid endDate" });
    }

    if (start >= end) {
      return res.status(400).json({
        message: "startDate must be before endDate"
      });
    }

    const regStart = parseDate(registrationStart);
    const regEnd = parseDate(registrationEnd);

    if (registrationStart && !regStart) {
      return res.status(400).json({ message: "Invalid registrationStart" });
    }

    if (registrationEnd && !regEnd) {
      return res.status(400).json({ message: "Invalid registrationEnd" });
    }

    if (regStart && regEnd && regStart >= regEnd) {
      return res.status(400).json({
        message: "registrationStart must be before registrationEnd"
      });
    }

    // ========== Capacity validation ==========
    let participants = maxParticipants;

    if (maxParticipants !== undefined && maxParticipants !== null && maxParticipants !== "") {
      participants = Number(maxParticipants);

      if (!Number.isInteger(participants) || participants < 1) {
        return res.status(400).json({
          message: "maxParticipants must be a positive integer"
        });
      }
    }

    // ========== Reference existence checks ==========
    const [existingDepartment, existingVenue] = await Promise.all([
      Department.findById(department),
      Venue.findById(venue)
    ]);

    if (!existingDepartment) {
      return res.status(404).json({ message: "Department not found" });
    }

    if (!existingVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Validate maxParticipants against venue capacity
    if (
      participants &&
      existingVenue.capacity &&
      participants > existingVenue.capacity
    ) {
      return res.status(400).json({
        message: `maxParticipants (${participants}) cannot exceed venue capacity (${existingVenue.capacity})`
      });
    }

    // ========== Create (always starts as DRAFT) ==========
    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category,
      organizer,
      department,
      venue,
      startDate: start,
      endDate: end,
      registrationStart: regStart,
      registrationEnd: regEnd,
      maxParticipants: participants,
      registrationRequired:
        registrationRequired === undefined ? true : registrationRequired === true,
      eligibility,
      image
    });

    const populatedEvent = await populateEvent(
      Event.findById(event._id)
    );

    res.status(201).json({
      message: "Event created successfully (status: DRAFT, submit for approval to publish)",
      event: populatedEvent
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating event",
      error: error.message
    });
  }
};


// ==========================================
// Get all events - PUBLIC
// ==========================================
const getEvents = async (req, res) => {
  try {
    // Public/student listing: only events that have been approved AND published.
    const events = await populateEvent(
      Event.find({ status: "PUBLISHED" }).sort({ startDate: 1 })
    );

    res.status(200).json({ count: events.length, events });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error: error.message });
  }
};

// Management listing for ORGANIZER/ADMIN. This endpoint intentionally exposes
// workflow states so organizers can submit/review/publish their own events and
// admins can review all events.
const getManageEvents = async (req, res) => {
  try {
    const filter = req.user.role === "ORGANIZER"
      ? { organizer: req.user._id }
      : {};

    const events = await populateEvent(
      Event.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({ count: events.length, events });
  } catch (error) {
    res.status(500).json({ message: "Error fetching managed events", error: error.message });
  }
};

// ==========================================
// Get a single event - PUBLIC
// ==========================================
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid event ID format"
      });
    }

    const event = await populateEvent(Event.findById(id));

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Public/student callers may only access published events.
    // Management users may access their own events; ADMIN may access all.
    const authHeader = req.headers.authorization || "";
    let canManage = false;
    if (authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const User = require("../database/User");
        const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id || decoded._id).select("role");
        canManage = Boolean(
          currentUser &&
          (currentUser.role === "ADMIN" ||
            (currentUser.role === "ORGANIZER" && event.organizer?._id?.toString() === (decoded.id || decoded._id).toString()))
        );
      } catch (_) {
        canManage = false;
      }
    }

    if (event.status !== "PUBLISHED" && !canManage) {
  return res.status(404).json({ message: "Event not available" });
}

// Count only active registrations
const registeredCount = await Registration.countDocuments({
  event: id,
  status: "REGISTERED"
});

res.status(200).json({
  event: {
    ...event.toObject(),
    registeredCount
  }
});

  } catch (error) {
    res.status(500).json({
      message: "Error fetching event",
      error: error.message
    });
  }
};


// ==========================================
// Update event
// Only the event's organizer or an ADMIN can update.
// Field-level access control:
//   - organizer, status and approval CANNOT be changed through this endpoint
//   - status transitions happen only via submit/approve/reject/publish
// ==========================================
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // ========== Ownership check ==========
    if (
      req.user.role !== "ADMIN" &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. Only the event organizer or an ADMIN can update this event"
      });
    }

    const body = req.body || {};

    // ========== Field-level access control ==========
    for (const field of PROTECTED_FIELDS) {
      if (body[field] !== undefined) {
        return res.status(400).json({
          message: `Field '${field}' cannot be changed directly. Use the approval workflow endpoints.`
        });
      }
    }

    // Whitelist what can be updated
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    // ========== Validate provided fields ==========
    if (updates.title !== undefined && (typeof updates.title !== "string" || !updates.title.trim())) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (updates.description !== undefined && (typeof updates.description !== "string" || !updates.description.trim())) {
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    if (updates.category !== undefined && !CATEGORIES.includes(updates.category)) {
      return res.status(400).json({
        message: "category must be one of: TECHNICAL, CULTURAL, SPORTS, WORKSHOP, SEMINAR, HACKATHON, COMPETITION, OTHER"
      });
    }

    if (updates.department !== undefined) {
      if (!isValidObjectId(updates.department)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }

      const existingDepartment = await Department.findById(updates.department);

      if (!existingDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }
    }

    if (updates.venue !== undefined) {
      if (!isValidObjectId(updates.venue)) {
        return res.status(400).json({ message: "Invalid venue ID format" });
      }

      const existingVenue = await Venue.findById(updates.venue);

      if (!existingVenue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    // ========== Date validation (merge with existing values) ==========
    const startDate = parseDate(
      updates.startDate !== undefined ? updates.startDate : event.startDate
    );
    const endDate = parseDate(
      updates.endDate !== undefined ? updates.endDate : event.endDate
    );

    if (updates.startDate !== undefined && !startDate) {
      return res.status(400).json({ message: "Invalid startDate" });
    }

    if (updates.endDate !== undefined && !endDate) {
      return res.status(400).json({ message: "Invalid endDate" });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        message: "startDate must be before endDate"
      });
    }

    const regStart = updates.registrationStart !== undefined
      ? parseDate(updates.registrationStart)
      : event.registrationStart;
    const regEnd = updates.registrationEnd !== undefined
      ? parseDate(updates.registrationEnd)
      : event.registrationEnd;

    if (updates.registrationStart !== undefined && !regStart) {
      return res.status(400).json({ message: "Invalid registrationStart" });
    }

    if (updates.registrationEnd !== undefined && !regEnd) {
      return res.status(400).json({ message: "Invalid registrationEnd" });
    }

    if (regStart && regEnd && regStart >= regEnd) {
      return res.status(400).json({
        message: "registrationStart must be before registrationEnd"
      });
    }

    // ========== Capacity validation ==========
    let maxParticipants =
      updates.maxParticipants !== undefined
        ? Number(updates.maxParticipants)
        : event.maxParticipants;

    if (
      updates.maxParticipants !== undefined &&
      (!Number.isInteger(maxParticipants) || maxParticipants < 1)
    ) {
      return res.status(400).json({
        message: "maxParticipants must be a positive integer"
      });
    }

    // Check capacity against the effective venue
    if (maxParticipants) {
      const venueId = updates.venue !== undefined
        ? updates.venue
        : event.venue;

      const venueDoc = await Venue.findById(venueId);

      if (venueDoc && venueDoc.capacity && maxParticipants > venueDoc.capacity) {
        return res.status(400).json({
          message: `maxParticipants (${maxParticipants}) cannot exceed venue capacity (${venueDoc.capacity})`
        });
      }
    }

    // ========== Apply updates ==========
    if (updates.title !== undefined) event.title = updates.title.trim();
    if (updates.description !== undefined) event.description = updates.description.trim();
    if (updates.category !== undefined) event.category = updates.category;
    if (updates.department !== undefined) event.department = updates.department;
    if (updates.venue !== undefined) event.venue = updates.venue;

    event.startDate = startDate;
    event.endDate = endDate;
    event.registrationStart = regStart;
    event.registrationEnd = regEnd;
    event.maxParticipants = maxParticipants;

    if (updates.registrationRequired !== undefined) {
      event.registrationRequired = updates.registrationRequired === true;
    }
    if (updates.eligibility !== undefined) event.eligibility = updates.eligibility;
    if (updates.image !== undefined) event.image = updates.image;

    await event.save();

    const populatedEvent = await populateEvent(
      Event.findById(event._id)
    );

    res.status(200).json({
      message: "Event updated successfully",
      event: populatedEvent
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating event",
      error: error.message
    });
  }
};


// ==========================================
// Submit event for approval
// ORGANIZER (owner) / ADMIN
// DRAFT or REJECTED -> PENDING_APPROVAL
// ==========================================
const submitEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Ownership check
    if (
      req.user.role !== "ADMIN" &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. Only the event organizer or an ADMIN can submit this event"
      });
    }

    if (event.status !== "DRAFT" && event.status !== "REJECTED") {
      return res.status(400).json({
        message: `Only DRAFT or REJECTED events can be submitted for approval (current status: ${event.status})`
      });
    }

    event.status = "PENDING_APPROVAL";
    event.approval.status = "PENDING";
    event.approval.reviewedBy = null;
    event.approval.reviewedAt = null;
    event.approval.comment = null;

    await event.save();

    res.status(200).json({
      message: "Event submitted for approval",
      event
    });

  } catch (error) {
    res.status(500).json({
      message: "Error submitting event for approval",
      error: error.message
    });
  }
};


// ==========================================
// Approve event - ADMIN only
// PENDING_APPROVAL -> APPROVED
// ==========================================
const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        message: `Only events pending approval can be approved (current status: ${event.status})`
      });
    }

    event.status = "APPROVED";
    event.approval.status = "APPROVED";
    event.approval.reviewedBy = req.user._id;
    event.approval.reviewedAt = new Date();
    event.approval.comment = null;

    await event.save();

    res.status(200).json({
      message: "Event approved successfully",
      event
    });

  } catch (error) {
    res.status(500).json({
      message: "Error approving event",
      error: error.message
    });
  }
};


// ==========================================
// Reject event - ADMIN only
// PENDING_APPROVAL -> REJECTED (with comment)
// ==========================================
const rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        message: `Only events pending approval can be rejected (current status: ${event.status})`
      });
    }

    const { comment } = req.body;

    event.status = "REJECTED";
    event.approval.status = "REJECTED";
    event.approval.reviewedBy = req.user._id;
    event.approval.reviewedAt = new Date();
    event.approval.comment =
      comment && typeof comment === "string" ? comment.trim() : null;

    await event.save();

    res.status(200).json({
      message: "Event rejected",
      event
    });

  } catch (error) {
    res.status(500).json({
      message: "Error rejecting event",
      error: error.message
    });
  }
};


// ==========================================
// Publish event
// ORGANIZER (owner) / ADMIN
// APPROVED -> PUBLISHED (cannot publish without approval)
// ==========================================
const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Ownership check
    if (
      req.user.role !== "ADMIN" &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. Only the event organizer or an ADMIN can publish this event"
      });
    }

    if (event.status !== "APPROVED") {
      return res.status(400).json({
        message: `Only approved events can be published (current status: ${event.status}). Events cannot be published without admin approval.`
      });
    }

    event.status = "PUBLISHED";

    await event.save();

    res.status(200).json({
      message: "Event published successfully",
      event
    });

  } catch (error) {
    res.status(500).json({
      message: "Error publishing event",
      error: error.message
    });
  }
};


// ==========================================
// Delete event - ADMIN only (route)
// ==========================================
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.status(200).json({
      message: "Event deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting event",
      error: error.message
    });
  }
};


// ==========================================
// Export all controller functions
// ==========================================
module.exports = {
  createEvent,
  getEvents,
  getManageEvents,
  getEventById,
  updateEvent,
  submitEvent,
  approveEvent,
  rejectEvent,
  publishEvent,
  deleteEvent
};