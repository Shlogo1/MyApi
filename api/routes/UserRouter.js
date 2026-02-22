const express = require("express");
const router = express.Router();

// NOTE: controller file name is UsersController.js
const UserController = require("../controllers/UsersController");

// create or update user (sync)
router.post("/sync", UserController.registerOrSyncUser);

// get by firebase uid
router.get("/byFirebaseUid/:firebaseUid", UserController.getByFirebaseUid);

// get by mongo id
router.get("/id/:id", UserController.getById);

// search by email
router.get("/search", UserController.searchByEmail);

// contacts (friends) with last message preview
router.get("/contacts/:userId", UserController.getContactsWithLastMessage);

// optional - all users
router.get("/", UserController.getAllUsers);

module.exports = router;