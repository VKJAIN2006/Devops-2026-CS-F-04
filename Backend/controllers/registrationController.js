const Registration = require("../models/Registration");
const User = require("../models/User");
const Event = require("../models/Event");


// Register a user for an event
const createRegistration = async (req, res) => {
  try {
    const {
      user,
      event
    } = req.body;

    // 1. Check if user exists
    const existingUser = await User.findById(user);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // 2. Check if event exists
    const existingEvent = await Event.findById(event);

    if (!existingEvent) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // 3. Check whether registration is required
    if (!existingEvent.registrationRequired) {
      return res.status(400).json({
        message: "Registration is not required for this event"
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

    // 5. Check whether the event is cancelled
    if (existingEvent.status === "CANCELLED") {
      return res.status(400).json({
        message: "Cannot register for a cancelled event"
      });
    }

    // 6. Check if user is already registered
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

    // 7. Check event capacity
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

    // 8. Create registration
    const registration = await Registration.create({
      user,
      event
    });

    // 9. Return registration with useful information
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


// Get all registrations
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


// Get registration by ID
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


// Cancel registration
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(
      req.params.id
    );

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    if (registration.status === "CANCELLED") {
      return res.status(400).json({
        message: "Registration is already cancelled"
      });
    }

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


module.exports = {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  cancelRegistration
};