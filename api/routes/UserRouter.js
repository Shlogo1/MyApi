const express = require("express");
const router = express.Router();

// שינוי קריטי: הוספתי את ה-s לשם הקובץ כדי שיתאים לתמונה שלך
const userController = require("../controllers/UsersController");

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

// דוגמה ל-Route ב-Node.js שמעדכן את הזמן
router.post("/update-conversation-time/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Conversation.findByIdAndUpdate(id, { lastUpdated: new Date() });
        res.status(200).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;