const express = require("express");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);


// Protected route - get current logged-in user
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "Authenticated user",
    user: req.user
  });
});

router.get(
  "/admin-test",
  protect,
  authorize("ADMIN"),
  (req, res) => {
    res.status(200).json({
      message: "Welcome Admin"
    });
  }
);

module.exports = router;