const User = require("../models/Users"); 
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose"); // הוספתי את זה בשביל בדיקות ID

module.exports = {
  // POST /users/sync
  registerOrSyncUser: async (req, res) => {
    try {
      const { firebaseUid, email, displayName, profileImage } = req.body;

      if (!firebaseUid) {
        return res.status(400).json({ message: "firebaseUid is required" });
      }

      let user = await User.findOne({ firebaseUid });

      if (!user) {
        user = await User.create({
          firebaseUid,
          email: email || "",
          displayName: displayName || "",
          profileImage: profileImage || "",
        });
      } else {
        user.email = email ?? user.email;
        user.displayName = displayName ?? user.displayName;
        user.profileImage = profileImage ?? user.profileImage;
        await user.save();
      }

      return res.status(200).json(user);
    } catch (e) {
      console.error("registerOrSyncUser error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // GET /users/byFirebaseUid/:firebaseUid
  getByFirebaseUid: async (req, res) => {
    try {
      const { firebaseUid } = req.params;

      const user = await User.findOne({ firebaseUid }).select("-__v");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user);
    } catch (e) {
      console.error("getByFirebaseUid error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // GET /users?viewerId=...
  // הנה הפונקציה המעודכנת שתסדר לך את הריפרש
  getAllUsers: async (req, res) => {
    try {
        const { viewerId } = req.query; // ה-ID של המשתמש שצופה ברשימה כרגע
        
        let users = await User.find().select("-__v").lean();

        if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
            // מוצאים את כל השיחות שהמשתמש הזה משתתף בהן (שולח או מקבל)
            const conversations = await Conversation.find({
                members: { $in: [viewerId] }
            }).select("members lastUpdated").lean();

            // יוצרים מפה של: איזה משתמש קשור לאיזה תאריך עדכון אחרון
            const lastUpdateMap = {};
            conversations.forEach(c => {
                const otherMember = c.members.find(m => m.toString() !== viewerId.toString());
                if (otherMember) {
                    lastUpdateMap[otherMember.toString()] = c.lastUpdated;
                }
            });

            // מיון: מי שדיברנו איתו לאחרונה יהיה למעלה
            users.sort((a, b) => {
                const dateA = lastUpdateMap[a._id.toString()] ? new Date(lastUpdateMap[a._id.toString()]) : new Date(0);
                const dateB = lastUpdateMap[b._id.toString()] ? new Date(lastUpdateMap[b._id.toString()]) : new Date(0);
                return dateB - dateA;
            });
        }

        return res.status(200).json(users);
    } catch (e) {
        console.error("getAllUsers error:", e);
        return res.status(500).json({ message: "Server error" });
    }
},

  // GET /users/id/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select("-__v");
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json(user);
    } catch (e) {
      console.error("getById error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // GET /users/search?email=...
  searchByEmail: async (req, res) => {
    try {
      const email = (req.query.email || "").toString().trim().toLowerCase();
      if (!email) return res.status(400).json({ message: "email query is required" });

      const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') }).select("-__v");
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json(user);
    } catch (e) {
      console.error("searchByEmail error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // GET /users/contacts/:userId
  getContactsWithLastMessage: async (req, res) => {
    try {
      const { userId } = req.params;
      const me = await User.findById(userId).select("contacts");
      if (!me) return res.status(404).json({ message: "User not found" });

      const contactIds = new Set((me.contacts || []).map(x => x.toString()));

      const convos = await Conversation.find({
        members: { $in: [userId] },
        $expr: { $eq: [{ $size: "$members" }, 2] }
      }).sort({ lastUpdated: -1, updatedAt: -1 });

      for (const c of convos) {
        const other = c.members.map(m => m.toString()).find(id => id !== userId);
        if (other) contactIds.add(other);
      }

      const contacts = await User.find({ _id: { $in: Array.from(contactIds) } }).select("-__v");

      const convoByOther = new Map();
      for (const c of convos) {
        const other = c.members.map(m => m.toString()).find(id => id !== userId);
        if (other) convoByOther.set(other, c);
      }

      const result = contacts.map(u => {
        const otherId = u._id.toString();
        const c = convoByOther.get(otherId);
        return {
          user: u,
          conversationId: c ? c._id : null,
          lastMessage: c ? (c.lastMessage || "") : "",
          lastUpdated: c ? c.lastUpdated : null
        };
      });

      result.sort((a, b) => {
        const ta = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const tb = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return tb - ta;
      });

      return res.status(200).json(result);
    } catch (e) {
      console.error("getContactsWithLastMessage error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  },
};