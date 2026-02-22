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

router.post("/update-time/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // מעדכן רק את התאריך בשיחה הקיימת
        await Conversation.findByIdAndUpdate(id, { lastUpdated: new Date() });
        res.status(200).send("Updated");
    } catch (e) {
        res.status(500).send(e);
    }
});
module.exports = router;