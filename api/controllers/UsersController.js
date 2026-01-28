const User = require("../models/Users"); // אצלך המודל נקרא UserSocial אבל מיוצא מהקובץ Users.js

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
};