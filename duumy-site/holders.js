const mongoose = require("mongoose");

const MONGO_URI_HOLDERS = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/holders?retryWrites=true&w=majority&appName=Daomex';

// Holders database connection
const holdersConnection = mongoose.createConnection(MONGO_URI_HOLDERS);

holdersConnection.once('open', () => {
    console.log('Connected to the holders MongoDB database!');
});

holdersConnection.on("error", (err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

const holderSchema = new mongoose.Schema({
    address: { type: String, required: true }, // Wallet address of the holder
    balance: { type: Number, required: true }, // Token balance of the holder
    percentageHold: { type: Number, required: true }, // Percentage of total supply held
});

  const HolderModel = mongoose.model("Holder", holderSchema);

  module.exports = HolderModel;