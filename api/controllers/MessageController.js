const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const UserSocial = require("../models/Users");

async function addContactsFromConversation(conversation, senderId) {
    if (!conversation || !senderId || !conversation.members) return;
    // For 1-1 chats: add the other participant. For group chats: add all.
    const otherIds = conversation.members
        .map(m => m.toString())
        .filter(id => id !== senderId.toString());

    await Promise.all(
        otherIds.map(otherId => Promise.all([
            UserSocial.updateOne({ _id: senderId }, { $addToSet: { contacts: otherId } }),
            UserSocial.updateOne({ _id: otherId }, { $addToSet: { contacts: senderId } })
        ]))
    );
}

module.exports = {

    // Send Message
    sendMessage: async (req, res) => {
        try {
            const { conversationId, senderId, text } = req.body;

            if (!conversationId || !senderId || !text) {
                return res.status(400).json({ message: "conversationId, senderId and text are required" });
            }

            // Make sure conversation exists
            const conversation = await Conversation.findById(conversationId);
            // ... אחרי ה-findById של ה-conversation
if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
}

// --- הוסף רק את זה ---
const receiverId = conversation.members.find(m => m.toString() !== senderId.toString());
const [sender, receiver] = await Promise.all([
    UserSocial.findById(senderId),
    UserSocial.findById(receiverId)
]);

// בדיקה בטוחה שלא מפילה את השרת
const isBlocked = (sender?.blockedUsers?.map(id => id.toString()).includes(receiverId?.toString())) ||
                  (receiver?.blockedUsers?.map(id => id.toString()).includes(senderId?.toString()));

if (isBlocked) {
    return res.status(403).json({ message: "Blocked" });
}
// -----------------------

// ... כאן ממשיך הקוד המקורי שלך (Create message וכו')

            // Create message
            const message = new Message({
                conversationId,
                senderId,
                text
            });

            await message.save();

            // Make sure sender and receiver appear as contacts
            await addContactsFromConversation(conversation, senderId);

            // Update last message info in conversation
            conversation.lastMessage = text;
            conversation.lastUpdated = new Date();
            await conversation.save();

            // Realtime: emit to all clients in this conversation room
            // (clients join room named by conversationId)
            const io = req.app.get('io');
            if (io) {
                io.to(conversationId.toString()).emit('new_message', {
                    _id: message._id,
                    conversationId: conversationId,
                    senderId: senderId,
                    text: text,
                    createdAt: message.createdAt
                });
            }

            return res.status(201).json({
                message: "Message sent successfully",
                data: message
            });

        } catch (error) {
            console.error("sendMessage error:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    // Get Messages of Conversation
    getMessagesByConversation: async (req, res) => {
        try {
            const { conversationId } = req.params;

            const messages = await Message.find({ conversationId })
                .sort({ createdAt: 1 });

            return res.status(200).json(messages);

        } catch (error) {
            console.error("getMessagesByConversation error:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    // Delete Message
    deleteMessage: async (req, res) => {
        try {
            const { messageId } = req.params;

            const deleted = await Message.findByIdAndDelete(messageId);

            if (!deleted) {
                return res.status(404).json({ message: "Message not found" });
            }

            return res.status(200).json({ message: "Message deleted successfully" });

        } catch (error) {
            console.error("deleteMessage error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

};
