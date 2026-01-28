const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSocial"
    }],

    // for quick preview in conversation lists
    lastMessage: {
        type: String,
        default: ""
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);