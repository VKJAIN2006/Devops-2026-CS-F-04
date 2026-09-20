const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
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

    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "PARTICIPATION",
        "WINNER",
        "RUNNER_UP",
        "VOLUNTEER",
        "ORGANIZER"
      ],
      default: "PARTICIPATION"
    },

    status: {
      type: String,
      enum: ["GENERATED", "ISSUED", "REVOKED"],
      default: "GENERATED"
    },

    issuedAt: {
      type: Date,
      default: Date.now
    },

    certificateUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Certificate = mongoose.model(
  "Certificate",
  certificateSchema
);

module.exports = Certificate;