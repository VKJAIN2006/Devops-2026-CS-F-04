const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: [
        "TECHNICAL",
        "CULTURAL",
        "SPORTS",
        "WORKSHOP",
        "SEMINAR",
        "HACKATHON",
        "COMPETITION",
        "OTHER"
      ],
      required: true
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },

    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    registrationStart: {
      type: Date
    },

    registrationEnd: {
      type: Date
    },

    maxParticipants: {
      type: Number,
      min: 1
    },

    registrationRequired: {
      type: Boolean,
      default: true
    },

    eligibility: {
      type: String,
      default: "All Students"
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "PUBLISHED",
        "ONGOING",
        "COMPLETED",
        "CANCELLED",
        "REJECTED"
      ],
      default: "DRAFT"
    },

    approval: {
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      reviewedAt: {
        type: Date,
        default: null
      },

      comment: {
        type: String,
        default: null
      }
    },

    image: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;