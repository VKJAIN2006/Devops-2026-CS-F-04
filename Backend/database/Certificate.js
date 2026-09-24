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
    },

    // HMAC-SHA256 over certificateNumber (JWT_SECRET) - tamper detection
    certificateHash: {
      type: String,
      default: null
    },

    // Who generated the certificate (always from JWT)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Optional expiry (e.g. for time-limited awards)
    expiresAt: {
      type: Date,
      default: null
    },

    // Revocation audit
    revokedAt: {
      type: Date,
      default: null
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    revocationReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Only ONE active (non-revoked) certificate per user + event.
// A partial unique index lets a certificate be re-issued AFTER revocation.
certificateSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "REVOKED" } }
  }
);

const Certificate = mongoose.model(
  "Certificate",
  certificateSchema
);

module.exports = Certificate;