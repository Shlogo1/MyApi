const User = require("../models/Users");

module.exports = {
    // Create or Sync Firebase User
    registerOrSyncUser: async (req, res) => {
        try {
            const { firebaseUid, email, displayName, profileImage } = req.body;

            if (!firebaseUid) {
                return res.status(400).json({ message: "firebaseUid is required" });
            }

            // Check if user exists
            let user = await User.findOne({ firebaseUid });

            // If not exists → create new
            if (!user) {
                user = new User({
                    firebaseUid,
                    email: email || "",
                    displayName: displayName || "",
                    profileImage: profileImage || ""
                });

                await user.save();
            }

            return res.status(200).json({
                message: "User synced successfully",
                user
            });

        } catch (error) {
            console.error("registerOrSyncUser error:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find().select("-__v");
            res.status(200).json(users);
        } catch (error) {
            console.error("getAllUsers error:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    // Get user by Firebase UID
    getUserByUid: async (req, res) => {
        try {
            const { firebaseUid } = req.params;

            const user = await User.findOne({ firebaseUid });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json(user);

        } catch (error) {
            console.error("getUserByUid error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
}