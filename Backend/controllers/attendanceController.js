const Attendance = require("../models/Attendance");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Event = require("../models/Event");


// ==========================================
// Mark attendance
// ==========================================
const markAttendance = async (req, res) => {
  try {
    const {
      user,
      event,
      status,
      method
    } = req.body;

    // Validate required fields
    if (!user || !event) {
      return res.status(400).json({
        message: "User and event are required"
      });
    }

    // Check user
    const existingUser = await User.findById(user);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Check event
    const existingEvent = await Event.findById(event);

    if (!existingEvent) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // Check registration
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

    // Check duplicate attendance
    const existingAttendance = await Attendance.findOne({
      user,
      event
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance has already been marked for this user"
      });
    }

    // Create attendance
    const attendance = await Attendance.create({
      user,
      event,
      registration: registration._id,
      status: status || "PRESENT",
      markedBy: req.user._id,
      method: method || "MANUAL"
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


// ==========================================
// Get all attendance records
// ==========================================
const getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("registration")
      .populate("markedBy", "name email role");

    res.status(200).json({
      count: attendance.length,
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance",
      error: error.message
    });
  }
};


// ==========================================
// Get attendance by ID
// ==========================================
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("registration")
      .populate("markedBy", "name email role");

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance",
      error: error.message
    });
  }
};


// ==========================================
// Update attendance
// ==========================================
const updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        status
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("registration")
      .populate("markedBy", "name email role");

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance
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
  getAttendance,
  getAttendanceById,
  updateAttendance
};