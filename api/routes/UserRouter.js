const express = require("express");
const router = express.Router();
// אנחנו מייבאים את הקונטרולר ומגדירים אותו תחת השם userController
const userController = require("../controllers/UserController");

// create or update user (sync)
router.post("/sync", userController.registerOrSyncUser);

// get by firebase uid
router.get("/byFirebaseUid/:firebaseUid", userController.getByFirebaseUid);

// get by mongo id
router.get("/id/:id", userController.getById);

// search by email
router.get("/search", userController.searchByEmail);

// contacts (friends) with last message preview
router.get("/contacts/:userId", userController.getContactsWithLastMessage);

// optional - all users
router.get("/", userController.getAllUsers);

// block user
router.post("/block", userController.blockUser);

module.exports = router;