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
            return res.status(400).json({ message: "Missing fields" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        // 1. מציאת הנמען - שימוש ב-toString() כדי למנוע בעיות השוואה
        const receiverId = conversation.members.find(m => m.toString() !== senderId.toString());

        if (receiverId) {
            // 2. בדיקת חסימה - רק אם הנמען קיים
            const [sender, receiver] = await Promise.all([
                UserSocial.findById(senderId).lean(),
                UserSocial.findById(receiverId).lean()
            ]);

            // בדיקת בטיחות: האם המשתמשים קיימים והאם יש להם מערך חסומים
            const iBlocked = sender?.blockedUsers?.some(id => id.toString() === receiverId.toString());
            const heBlocked = receiver?.blockedUsers?.some(id => id.toString() === senderId.toString());

            if (iBlocked || heBlocked) {
                return res.status(403).json({ message: "Blocked", isBlocked: true });
            }
        }

        // 3. יצירת ההודעה (רק אם לא חסום)
        const message = new Message({ conversationId, senderId, text });
        await message.save();

        // עדכון אנשי קשר ושיחה (אופציונלי - לא מעכב את התשובה)
        addContactsFromConversation(conversation, senderId).catch(console.error);
        
        conversation.lastMessage = text;
        conversation.lastUpdated = new Date();
        await conversation.save();

        // 4. שליחה ב-Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(conversationId.toString()).emit('new_message', message);
        }

        return res.status(201).json({ message: "Success", data: message });

    } catch (error) {
        console.error("sendMessage error:", error);
        res.status(500).json({ message: "Server error" });
    }
},

    // שאר הפונקציות נשארות ללא שינוי...
    getMessagesByConversation: async (req, res) => { /* ... */ },
    deleteMessage: async (req, res) => { /* ... */ }
};