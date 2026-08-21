const Registration = require("../models/Registration");
const Event = require("../models/Event");



// ==========================================
// Register logged-in user for an event
// ==========================================
const createRegistration = async (req, res) => {
  try {
    const { event } = req.body;

    // Get logged-in user from JWT token
    const user = req.user._id;

    // 1. Check if event exists
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

    // 3. Check registration dates
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

    // 4. Check whether event is cancelled
    if (existingEvent.status === "CANCELLED") {
      return res.status(400).json({
        message: "Cannot register for a cancelled event"
      });
    }

    // 5. Check if user is already registered
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

    // 6. Check event capacity
    if (existingEvent.maxParticipants) {
      const registeredCount = await Registration.countDocuments({
        event,
        status: "REGISTERED"
      });

      if (registeredCount >= existingEvent.maxParticipants) {
        return res.status(400).json({
          message: "Event registration is full"
        });
      }
    }

    // 7. Create registration
    const registration = await Registration.create({
      user,
      event
    });

    // 8. Populate registration details
    const populatedRegistration = await Registration.findById(
      registration._id
    )
      .populate("user", "name email role")
      .populate(
        "event",
        "title category startDate endDate venue"
      );

    res.status(201).json({
      message: "Registration successful",
      registration: populatedRegistration
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating registration",
      error: error.message
    });
  }
};


// ==========================================
// Get all registrations
// ADMIN only - protected in routes
// ==========================================
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


// ==========================================
// Get registration by ID
// ==========================================
const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(
      req.params.id
    )
      .populate("user", "name email role")
      .populate(
        "event",
        "title category startDate endDate"
      );

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    res.status(200).json({
      registration
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching registration",
      error: error.message
    });
  }
};


// ==========================================
// Cancel registration
// ==========================================
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

    // Student can cancel only their own registration
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

    // Cancel registration
    registration.status = "CANCELLED";
    registration.cancelledAt = new Date();

    await registration.save();

    res.status(200).json({
      message: "Registration cancelled successfully",
      registration
    });

  } catch (error) {
    res.status(500).json({
      message: "Error cancelling registration",
      error: error.message
    });
  }
};
// Get registrations of the logged-in user
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

// ==========================================
// Export all controller functions
// ==========================================
module.exports = {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  cancelRegistration,
  getMyRegistrations
};