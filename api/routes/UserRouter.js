const express = require("express");
const router = express.Router();
// ודא שהשם כאן הוא userController
const userController = require("../controllers/UserController");

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

router.post("/block", userController.blockUser);

module.exports = router;