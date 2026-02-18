const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const UserSocial = require("../models/Users"); // וודא שהנתיב תקין

async function addContactsFromConversation(conversation, senderId) {
    if (!conversation || !senderId || !conversation.members) return;
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

    // Send Message - הגרסה המאובטחת עם חסימה
    sendMessage: async (req, res) => {
        try {
            const { conversationId, senderId, text } = req.body;

            if (!conversationId || !senderId || !text) {
                return res.status(400).json({ message: "conversationId, senderId and text are required" });
            }

            // 1. מציאת השיחה ובדיקה שהיא קיימת
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ message: "Conversation not found" });
            }

            // 2. זיהוי הנמען (המשתתף השני בשיחה)
            const receiverId = conversation.members.find(m => m.toString() !== senderId.toString());

            // 3. בדיקת חסימה דו-צדדית
            const [sender, receiver] = await Promise.all([
                UserSocial.findById(senderId),
                UserSocial.findById(receiverId)
            ]);

            if (!sender || !receiver) {
                return res.status(404).json({ message: "User not found" });
            }

            // האם אני חסמתי אותו? או האם הוא חסם אותי?
            const iBlockedHim = sender.blockedUsers && sender.blockedUsers.includes(receiverId);
            const heBlockedMe = receiver.blockedUsers && receiver.blockedUsers.includes(senderId);

            if (iBlockedHim || heBlockedMe) {
                // מחזירים 403 - האפליקציה תדע לנעול את הממשק
                return res.status(403).json({ 
                    message: "Action forbidden: One of the users is blocked",
                    isBlocked: true 
                });
            }

            // 4. אם לא חסום - ממשיכים כרגיל ביצירת ההודעה
            const message = new Message({
                conversationId,
                senderId,
                text
            });

            await message.save();

            // הוספה לאנשי קשר
            await addContactsFromConversation(conversation, senderId);

            // עדכון השיחה
            conversation.lastMessage = text;
            conversation.lastUpdated = new Date();
            await conversation.save();

            // שליחה ב-Realtime דרך Socket.io
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

    // שאר הפונקציות נשארות ללא שינוי...
    getMessagesByConversation: async (req, res) => { /* ... */ },
    deleteMessage: async (req, res) => { /* ... */ }
};