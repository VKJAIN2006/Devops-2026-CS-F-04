const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["STUDENT", "FACULTY", "ORGANIZER", "ADMIN"],
      default: "STUDENT"
    },

    studentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null
    },

    phone: {
      type: String,
      trim: true
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

const User = mongoose.model("User", userSchema);

module.exports = User;