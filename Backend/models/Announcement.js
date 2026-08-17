const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null
    },

    targetAudience: {
      type: String,
      enum: [
        "ALL",
        "STUDENTS",
        "FACULTY",
        "ORGANIZERS"
      ],
      default: "ALL"
    },

    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL"
    },

    isPublished: {
      type: Boolean,
      default: false
    },

    publishAt: {
      type: Date,
      default: null
    },

    expiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Announcement = mongoose.model(
  "Announcement",
  announcementSchema
);

module.exports = Announcement;