const express = require("express");
const router = express.Router();

// NOTE: controller file name is UsersController.js
const UserController = require("../controllers/UsersController");

// create or update user (sync)
router.post("/sync", UserController.registerOrSyncUser);

// get by firebase uid
router.get("/byFirebaseUid/:firebaseUid", UserController.getByFirebaseUid);

// optional - all users
router.get("/", UserController.getAllUsers);

module.exports = router;