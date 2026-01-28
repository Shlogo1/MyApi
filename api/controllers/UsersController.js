const User = require("../models/Users"); // אצלך המודל נקרא UserSocial אבל מיוצא מהקובץ Users.js
const Conversation = require("../models/Conversation");

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
        // אופציונלי: עדכון שדות אם הגיעו חדשים
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

  // GET /users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().select("-__v");
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
  // Returns contacts list (friends) with lastMessage + conversationId (if exists)
  getContactsWithLastMessage: async (req, res) => {
    try {
      const { userId } = req.params;
      const me = await User.findById(userId).select("contacts");
      if (!me) return res.status(404).json({ message: "User not found" });

      const contactIds = new Set((me.contacts || []).map(x => x.toString()));

      // Fetch conversations of this user (1-1 only)
      // We also use these conversations to "auto-discover" contacts for users created before
      // the contacts feature existed.
      const convos = await Conversation.find({
        members: { $in: [userId] },
        $expr: { $eq: [{ $size: "$members" }, 2] }
      }).sort({ lastUpdated: -1, updatedAt: -1 });

      for (const c of convos) {
        const other = c.members.map(m => m.toString()).find(id => id !== userId);
        if (other) contactIds.add(other);
      }

      // Fetch users
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

      // Sort by lastUpdated desc (nulls last)
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