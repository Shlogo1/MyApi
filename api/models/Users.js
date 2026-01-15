const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUid:{
    type: String,
    required: true,
    unique: true
  },
  email:{
    type: String,
    default: ""
  },
  displayName:{
    type: String,
    default: ""
  },
  profileImage:{
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("UserSocial", userSchema);
