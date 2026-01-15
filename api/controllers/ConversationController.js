const Conversation = require("../models/Conversation");
const User = require("../models/Users");

module.exports = {

    // Create conversation between two users
    createConversation: async (req, res) => {
        try {
            const { senderId, receiverId } = req.body;

            if(!senderId || !receiverId){
                return res.status(400).json({ message: "senderId and receiverId are required" });
            }

            // Check if conversation already exists
            const existingConversation = await Conversation.findOne({
                members: { $all: [senderId, receiverId] }
            });

            if(existingConversation){
                return res.status(200).json({
                    message: "Conversation already exists",
                    conversation: existingConversation
                });
            }

            // Create new conversation
            const newConversation = new Conversation({
                members: [senderId, receiverId]
            });

            await newConversation.save();

            return res.status(201).json({
                message: "Conversation created successfully",
                conversation: newConversation
            });

        } catch (error) {
            console.error("createConversation error:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    // Get all conversations of user
    getUserConversations: async (req, res) => {
        try {
            const { userId } = req.params;

            if(!userId){
                return res.status(400).json({ message: "userId is required" });
            }

            const conversations = await Conversation.find({
                members: { $in: [userId] }
            }).populate("members", "firebaseUid displayName email profileImage");

            res.status(200).json(conversations);

        } catch (error) {
            console.error("getUserConversations error:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    // Optional - Check if conversation exists between 2 users
    checkConversation: async (req, res) => {
        try {
            const { user1, user2 } = req.body;

            const conversation = await Conversation.findOne({
                members: { $all: [user1, user2] }
            });

            if(!conversation){
                return res.status(404).json({ message: "Conversation not found" });
            }

            res.status(200).json(conversation);

        } catch (error) {
            console.error("checkConversation error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

};
