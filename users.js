const mongoose = require("mongoose");

const MONGO_URI_USERS = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/Users?retryWrites=true&w=majority&appName=Daomex';

// Users database connection
const UsersConnection = mongoose.createConnection(MONGO_URI_USERS);

UsersConnection.once('open', () => {
    console.log('Connected to the holders MongoDB database!');
});

UsersConnection.on("error", (err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

const usersSchema = new mongoose.Schema({
    mint: { type: String, required: true }, 
    balance: { type: Number, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true }, 
    imageURI: { type: String },
    metadataURI: { type: String },
});

  const UsersModel = mongoose.model("Users", usersSchema);

  module.exports = { UsersConnection, UsersModel };
