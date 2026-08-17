const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
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

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      trim: true,
      default: ""
    },

    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// One feedback per user per event
feedbackSchema.index(
  { event: 1, user: 1 },
  { unique: true }
);

const Feedback = mongoose.model(
  "Feedback",
  feedbackSchema
);

module.exports = Feedback;