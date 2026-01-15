require('dotenv').config();
const mongoose = require('mongoose');

async function clearUsers() {
    await mongoose.connect(process.env.MONGO_STR);

    const User = mongoose.model('User');
    const res = await User.deleteMany({});

    console.log(`Delted ${res.deletedCount} users`);
    await mongoose.disconnect();
}
clearUsers();