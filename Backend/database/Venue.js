const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    building: {
      type: String,
      required: true,
      trim: true
    },

    floor: {
      type: String,
      trim: true
    },

    roomNumber: {
      type: String,
      trim: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    facilities: {
      type: [String],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Venue = mongoose.model("Venue", venueSchema);

module.exports = Venue;