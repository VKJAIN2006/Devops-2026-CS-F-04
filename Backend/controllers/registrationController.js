const mongoose = require("mongoose");
const Registration = require("../database/Registration");
const Event = require("../database/Event");


// ============================================================
// Constants & helpers
// ============================================================

// Event statuses that accept new registrations.
// DRAFT / PENDING_APPROVAL / APPROVED / COMPLETED / CANCELLED / REJECTED
// are never open for registration even if the window looks open.
const OPEN_EVENT_STATUSES = ["PUBLISHED", "ONGOING"];

// Every authenticated role is eligible by default (see Event.allowedRoles).
// ADMIN bypasses the eligibility list and can always register.
const ALL_ROLES = ["STUDENT", "FACULTY", "ORGANIZER", "ADMIN"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// ============================================================
// Register logged-in user for an event
//
// Route: POST /api/registrations  (any authenticated user)
// Eligibility is enforced against Event.allowedRoles (ADMIN bypass).
// If the event is full the user is placed on the WAITLIST instead of
// being rejected - they are auto-promoted when a slot frees up.
// ============================================================
const createRegistration = async (req, res) => {
  try {
    const { event } = req.body;

    // Get logged-in user from JWT token
    const user = req.user._id;

    // 1. Check if event exists
    if (!isValidObjectId(event)) {
      return res.status(400).json({
        message: "Invalid event ID format"
      });
    }

    const existingEvent = await Event.findById(event);

    if (!existingEvent) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // 2. Check whether registration is required
    if (!existingEvent.registrationRequired) {
      return res.status(400).json({
        message: "Registration is not required for this event"
      });
    }

    // 3. Check the event is actually open for registration
    if (!OPEN_EVENT_STATUSES.includes(existingEvent.status)) {
      return res.status(400).json({
        message: `Cannot register. Event is not open for registration (status: ${existingEvent.status})`
      });
    }

    // 4. Check registration dates
    const currentDate = new Date();

    if (
      existingEvent.registrationStart &&
      currentDate < existingEvent.registrationStart
    ) {
      return res.status(400).json({
        message: "Event registration has not started yet"
      });
    }

    if (
      existingEvent.registrationEnd &&
      currentDate > existingEvent.registrationEnd
    ) {
      return res.status(400).json({
        message: "Event registration has ended"
      });
    }

    // 5. Eligibility check (structured role-based eligibility)
    //    ADMIN is always eligible; everyone else must be in allowedRoles.
    if (
      req.user.role !== "ADMIN" &&
      !(existingEvent.allowedRoles || []).includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "Not eligible to register for this event. Contact the event organizer."
      });
    }

    // 6. Check if user is already registered (active = REGISTERED or WAITLISTED)
    const alreadyRegistered = await Registration.findOne({
      user,
      event,
      status: {
        $ne: "CANCELLED"
      }
    });

    if (alreadyRegistered) {
      return res.status(400).json({
        message: "User is already registered for this event"
      });
    }

    // 7. Check event capacity -> full means WAITLISTED, not a hard error
    let status = "REGISTERED";

    if (existingEvent.maxParticipants) {
      const registeredCount = await Registration.countDocuments({
        event,
        status: "REGISTERED"
      });

      if (registeredCount >= existingEvent.maxParticipants) {
        status = "WAITLISTED";
      }
    }

    // 8. Create registration
    const registration = await Registration.create({
      user,
      event,
      status
    });

    // 9. Populate registration details
    const populatedRegistration = await Registration.findById(
      registration._id
    )
      .populate("user", "name email role")
      .populate(
        "event",
        "title category startDate endDate venue maxParticipants"
      );

    const message =
      status === "WAITLISTED"
        ? "Registration successful. The event is full - you have been added to the waitlist."
        : "Registration successful";

    res.status(201).json({
      message,
      registration: populatedRegistration
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating registration",
      error: error.message
    });
  }
};


// ============================================================
// Get all registrations
// ADMIN only - protected in routes
// ============================================================
const getRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate("user", "name email role")
      .populate(
        "event",
        "title category startDate endDate"
      );

    res.status(200).json({
      count: registrations.length,
      registrations
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching registrations",
      error: error.message
    });
  }
};


// ============================================================
// Get registrations for a single event
// ADMIN or the event's own ORGANIZER only.
// ============================================================
const getEventRegistrations = async (req, res) => {
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

    // Organizers may only view registrations for events they own
    if (
      req.user.role !== "ADMIN" &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. You can only view registrations for your own events"
      });
    }

    const registrations = await Registration.find({
      event: eventId
    })
      .populate("user", "name email role studentId department")
      .populate("event", "title category startDate endDate")
      .sort({ createdAt: 1 });

    res.status(200).json({
      eventId,
      count: registrations.length,
      registrations
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching event registrations",
      error: error.message
    });
  }
};


// ============================================================
// Get registration by ID
// The registration owner OR an ADMIN can view it.
// ============================================================
const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(
      req.params.id
    );

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    // Ownership check - students can only view their own registration.
    // Must run BEFORE populate so registration.user is still an ObjectId.
    if (
      req.user.role !== "ADMIN" &&
      registration.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. You can only view your own registration"
      });
    }

    const populatedRegistration = await Registration.findById(
      registration._id
    )
      .populate("user", "name email role")
      .populate(
        "event",
        "title category startDate endDate"
      );

    res.status(200).json({
      registration: populatedRegistration
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching registration",
      error: error.message
    });
  }
};


// ============================================================
// Cancel registration
// Owner or ADMIN. Optional reason. Cannot cancel after the
// event has already started (ADMIN override). Frees a slot and
// auto-promotes the oldest WAITLISTED user to REGISTERED.
// ============================================================
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(
      req.params.id
    );

    // Check if registration exists
    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    // Owner can cancel only their own registration
    if (
      req.user.role !== "ADMIN" &&
      registration.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. You can only cancel your own registration"
      });
    }

    // Check if already cancelled
    if (registration.status === "CANCELLED") {
      return res.status(400).json({
        message: "Registration is already cancelled"
      });
    }

    const event = await Event.findById(registration.event);

    // Cannot cancel after the event has started (admin can clean up)
    if (
      event &&
      req.user.role !== "ADMIN" &&
      event.startDate &&
      new Date(event.startDate) <= new Date()
    ) {
      return res.status(400).json({
        message: "Cannot cancel. The event has already started"
      });
    }

    // Optional cancellation reason (e.g. provided by admin)
    const { reason } = req.body || {};
    const cancellationReason =
      reason && typeof reason === "string" && reason.trim()
        ? reason.trim()
        : null;

    // Cancel registration
    registration.status = "CANCELLED";
    registration.cancelledAt = new Date();
    registration.cancellationReason = cancellationReason;

    await registration.save();

    // Auto-promote the oldest WAITLISTED user for this event
    const promoted = await Registration.findOneAndUpdate(
      {
        event: registration.event,
        status: "WAITLISTED"
      },
      {
        $set: { status: "REGISTERED" }
      },
      {
        sort: { createdAt: 1 },
        returnDocument: "after"
      }
    );

    res.status(200).json({
      message: promoted
        ? "Registration cancelled successfully. A waitlisted user has been promoted."
        : "Registration cancelled successfully",
      registration,
      promoted: promoted
        ? { id: promoted._id, user: promoted.user }
        : null
    });

  } catch (error) {
    res.status(500).json({
      message: "Error cancelling registration",
      error: error.message
    });
  }
};


// ============================================================
// Get registrations of the logged-in user
// ============================================================
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user._id
    })
      .populate(
        "event",
        "title description category venue startDate endDate image"
      )
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      count: registrations.length,
      registrations
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching your registrations",
      error: error.message
    });
  }
};

// ==========================================================
// Export all controller functions
// ==========================================================
module.exports = {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  getEventRegistrations,
  cancelRegistration,
  getMyRegistrations
};