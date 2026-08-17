const express = require("express");

const {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback
} = require("../controllers/feedbackController");

const router = express.Router();


// Submit feedback
router.post("/", createFeedback);


// Get all feedback
router.get("/", getFeedback);


// Get feedback by ID
router.get("/:id", getFeedbackById);


// Update feedback
router.put("/:id", updateFeedback);


// Delete feedback
router.delete("/:id", deleteFeedback);


module.exports = router;