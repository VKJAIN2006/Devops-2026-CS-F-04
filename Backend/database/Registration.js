const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: ["REGISTERED", "CANCELLED", "WAITLISTED"],
      default: "REGISTERED"
    },

    registeredAt: {
      type: Date,
      default: Date.now
    },

    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent the same user from registering for the same event multiple times
registrationSchema.index(
  { event: 1, user: 1 },
  { unique: true }
);

const Registration = mongoose.model(
  "Registration",
  registrationSchema
);

module.exports = Registration;