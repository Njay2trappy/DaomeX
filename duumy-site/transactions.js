const mongoose = require("mongoose");

const MONGO_URI_TRANSACTIONS = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/transactions?retryWrites=true&w=majority&appName=Daomex';

// Transactions database connection
const transactionsConnection = mongoose.createConnection(MONGO_URI_TRANSACTIONS);

transactionsConnection.once('open', () => {
    console.log('Connected to the transactions MongoDB database!');
});

transactionsConnection.on("error", (err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

const transactionSchema = new mongoose.Schema({
    token: { type: String, required: true }, // Token name
    tokenAddress: { type: String, required: true }, // Contract address
    type: { type: String, required: true, enum: ["Buy", "Sell"] }, // Buy or Sell transaction
    quantity: { type: Number, required: true }, // Number of tokens transacted
    amount: { type: Number, required: true }, // Amount in AMB
    tokenPrice: { type: Number }, // Price per token at time of transaction
    virtualReserve: { type: Number }, // Virtual reserve value
    tokenReserve: { type: Number }, // Token reserve value
    marketCap: { type: Number }, // Market capitalization
    usdMarketCap: { type: Number }, // Market cap in USD
    usdPrice: { type: Number }, // Token price in USD
    timestamp: { type: Date, default: Date.now }, // Transaction timestamp
    buyer: { type: String }, // Buyer's wallet address (if Buy transaction)
    seller: { type: String }, // Seller's wallet address (if Sell transaction)
    transactionHash: { type: String, required: true, unique: true }, // Blockchain transaction hash
    bondingCurveAddress: { type: String, required: true }, // Bonding curve contract address
});

// ✅ Creating Transaction Model
const TransactionModel = transactionsConnection.model("Transaction", transactionSchema);

module.exports = { transactionsConnection, TransactionModel };