const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const UserSocial = require("../models/Users"); // אצלך המודל נקרא UserSocial למרות שהקובץ Users.js

async function addContactsBothWays(aUserId, bUserId) {
  // No-op if any id is missing
  if (!aUserId || !bUserId) return;
  await Promise.all([
    UserSocial.updateOne({ _id: aUserId }, { $addToSet: { contacts: bUserId } }),
    UserSocial.updateOne({ _id: bUserId }, { $addToSet: { contacts: aUserId } })
  ]);
}

module.exports = {
  // POST /conversation
  // body: { senderId, receiverId }  (שניהם MUST להיות Mongo _id של UserSocial)
  createConversation: async (req, res) => {
    try {
      let { senderId, receiverId } = req.body;

      if (!senderId || !receiverId) {
        return res.status(400).json({ message: "senderId and receiverId are required" });
      }

      // אם בטעות שולחים firebaseUid במקום _id -> ננסה לתקן אוטומטית
      // (כלומר: אם זה לא ObjectId תקין, נחפש משתמש לפי firebaseUid)
      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        const u = await UserSocial.findOne({ firebaseUid: senderId }).select("_id");
        if (!u) return res.status(400).json({ message: "senderId is not valid and firebaseUid not found" });
        senderId = u._id.toString();
      }

      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        const u = await UserSocial.findOne({ firebaseUid: receiverId }).select("_id");
        if (!u) return res.status(400).json({ message: "receiverId is not valid and firebaseUid not found" });
        receiverId = u._id.toString();
      }

      if (senderId === receiverId) {
        return res.status(400).json({ message: "Cannot create conversation with yourself" });
      }

      // תמיד נשמור members בסדר קבוע כדי למנוע כפילויות
      const a = senderId.toString();
      const b = receiverId.toString();
      const members = [a, b].sort(); // קבוע: [קטן, גדול]

      // בדיקה אם כבר קיימת שיחה
      const existing = await Conversation.findOne({
        members: { $all: members },
        $expr: { $eq: [{ $size: "$members" }, 2] } // לוודא שזו שיחה של 2 בלבד
      });

      if (existing) {
        // Make sure both users appear in each other's contacts
        await addContactsBothWays(senderId, receiverId);
        return res.status(200).json({
          message: "Conversation already exists",
          conversation: existing
        });
      }

      const newConversation = new Conversation({ members });
      await newConversation.save();

      // Add each other as contacts
      await addContactsBothWays(senderId, receiverId);

      return res.status(201).json({
        message: "Conversation created successfully",
        conversation: newConversation
      });

    } catch (error) {
      console.error("createConversation error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // GET /conversation/:userId
  // מחזיר את כל השיחות של משתמש
  getUserConversations: async (req, res) => {
    try {
      let { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // תמיכה אם שולחים firebaseUid במקום _id
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        const u = await UserSocial.findOne({ firebaseUid: userId }).select("_id");
        if (!u) return res.status(404).json({ message: "User not found" });
        userId = u._id.toString();
      }

      const conversations = await Conversation.find({
        members: { $in: [userId] }
      })
        // Keep members as ObjectId strings to match the Android models
        .sort({ lastUpdated: -1, updatedAt: -1 });

      return res.status(200).json(conversations);

    } catch (error) {
      console.error("getUserConversations error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // POST /conversation/check
  // body: { user1, user2 }  (מומלץ _id, אבל תומך גם firebaseUid)
  checkConversation: async (req, res) => {
    try {
      let { user1, user2 } = req.body;

      if (!user1 || !user2) {
        return res.status(400).json({ message: "user1 and user2 are required" });
      }

      if (!mongoose.Types.ObjectId.isValid(user1)) {
        const u = await UserSocial.findOne({ firebaseUid: user1 }).select("_id");
        if (!u) return res.status(404).json({ message: "user1 not found" });
        user1 = u._id.toString();
      }

      if (!mongoose.Types.ObjectId.isValid(user2)) {
        const u = await UserSocial.findOne({ firebaseUid: user2 }).select("_id");
        if (!u) return res.status(404).json({ message: "user2 not found" });
        user2 = u._id.toString();
      }

      const members = [user1.toString(), user2.toString()].sort();

      const conversation = await Conversation.findOne({
        members: { $all: members },
        $expr: { $eq: [{ $size: "$members" }, 2] }
      });

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      return res.status(200).json(conversation);

    } catch (error) {
      console.error("checkConversation error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
};