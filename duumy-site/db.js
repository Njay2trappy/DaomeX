const mongoose = require("mongoose");

// ✅ Connect to a single MongoDB instance
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/?retryWrites=true&w=majority&appName=Daomex";

mongoose.connect(MONGO_URI);

const primaryConnection = mongoose.connection;

primaryConnection.once("open", () => {
    console.log("✅ Connected to the primary MongoDB database!");
});

primaryConnection.on("error", (err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

// ✅ Define User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    bio: { type: String },
    walletAddress: { type: String, required: true, unique: true },
    parentAddress: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// ✅ Define Auth Schema
const AuthSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true },
    parentAddress: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// ✅ Define Token Schema
const tokenSchema = new mongoose.Schema({
    mint: { type: String, unique: true, required: true },
    address: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    totalSupply: { type: Number, required: true },
    balanceOf: { type: Number, required: true },
    bondingCurve: { type: String, required: true },
    creator: { type: String, required: true },
    transactionHash: { type: String, required: true },
    description: { type: String },
    imageURI: { type: String },
    metadataURI: { type: String },
    twitter: { type: String },
    telegram: { type: String },
    website: { type: String },
    pool: { type: String, default: "DAOMEFactory" },
    usdMarketCap: { type: Number, default: 0 },
    usdPrice: { type: Number, default: 0 },
    fdv: { type: Number, default: 0 },
    mint_authority: { type: Boolean, default: false },
    freeze_authority: { type: Boolean, default: false },
    liquidity_burned: { type: Boolean, default: true },
    migrated: { type: Boolean, default: false },
    burn_curve: { type: String, default: null },
    tokenPrice: { type: Number },
    virtualReserve: { type: Number },
    tokenReserve: { type: Number },
    marketCap: { type: Number },
});

const tradeSchema = new mongoose.Schema({
	mint: { type: String, unique: true, required: true },
	contractAddress: { type: String, unique: true, required: true },
	tokenPrice: { type: Number, required: true },
	virtualReserve: { type: Number, required: true },
	tokenReserve: { type: Number, required: true },
	marketCap: { type: Number, required: true },
	usdMarketCap: { type: Number, default: 0, required: true },
	usdPrice: { type: Number, default: 0, required: true },
});

// ✅ Create Models
const UserModel = primaryConnection.model("User", UserSchema, "users");
const AuthModel = primaryConnection.model("Auth", AuthSchema, "auth");
const Token = primaryConnection.model("Token", tokenSchema, "tokens");
const Trade = primaryConnection.model("Trade", tradeSchema, "trades");

module.exports = { primaryConnection, UserModel, AuthModel, Token, Trade };
