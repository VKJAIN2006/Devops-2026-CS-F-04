const express = require("express");

const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} = require("../controllers/announcementController");

const router = express.Router();


// Create announcement
router.post("/", createAnnouncement);


// Get all announcements
router.get("/", getAnnouncements);


// Get announcement by ID
router.get("/:id", getAnnouncementById);


// Update announcement
router.put("/:id", updateAnnouncement);


// Delete announcement
router.delete("/:id", deleteAnnouncement);


module.exports = router;