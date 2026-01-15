const express = require("express");
const router = express.Router();

const { sendMessage, getMessagesByConversation, deleteMessage } = require("../controllers/MessageController");

// Send message
router.post("/", sendMessage);

// Get messages of a conversation
router.get("/:conversationId", getMessagesByConversation);

// Delete message
router.delete("/:messageId", deleteMessage);

module.exports = router;
