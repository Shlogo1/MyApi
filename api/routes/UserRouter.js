const express = require("express");
const router = express.Router();

const { registerOrSyncUser,getAllUsers,getUserByUid} = require("../controllers/UsersController");

// Register or Sync Firebase User
router.post("/register", registerOrSyncUser);

// Get all users
router.get("/", getAllUsers);

// Get user by firebase UID
router.get("/:firebaseUid", getUserByUid);

module.exports = router;
