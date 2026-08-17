const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      default: "PRESENT"
    },

    markedAt: {
      type: Date,
      default: Date.now
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    method: {
      type: String,
      enum: ["MANUAL", "QR"],
      default: "MANUAL"
    }
  },
  {
    timestamps: true
  }
);

// One attendance record per user per event
attendanceSchema.index(
  { event: 1, user: 1 },
  { unique: true }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

module.exports = Attendance;