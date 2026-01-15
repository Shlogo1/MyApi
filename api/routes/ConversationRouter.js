const express = require("express");
const router = express.Router();

const { createConversation, getUserConversations, checkConversation} = require("../controllers/ConversationController");

// Create conversation
router.post("/", createConversation);

// Get all conversations of user
router.get("/:userId", getUserConversations);

// Check if conversation exists
router.post("/check", checkConversation);

module.exports = router;
