const crypto = require("crypto");
const Web3 = require("web3");
const mongoose = require("mongoose");
const { GraphQLUpload } = require("graphql-upload");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { createReadStream } = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { primaryConnection, UserModel, AuthModel, Token, Trade } = require("./db"); // ✅ Corrected impor
const { transactionsConnection, TransactionModel } = require("./transactions")
const { holdersConnection, HolderModel } = require("./holders");
const { UsersConnection, UsersModel } = require("./users");
//const { eventEmitter } = require("./server"); // ✅ Import the global EventEmitter
require("dotenv").config(); // Ensure dotenv is required at the top

const SECRET_KEY = process.env.SECRET_KEY || "supersecretkey"; // Secure Secret Key

const web3 = new Web3('https://rpc.airdao.io');
const factoryABI =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_feeToSetter",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "bondingCurve",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "metadataURI",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "imageURI",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "identifier",
				"type": "string"
			}
		],
		"name": "TokenCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "allTokens",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "symbol",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "metadataURI",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageURI",
				"type": "string"
			}
		],
		"name": "createToken",
		"outputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "bondingCurve",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "identifier",
				"type": "string"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "creationFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feeTo",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feeToSetter",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "getTokenDetails",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "symbol",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "identifier",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "bondingCurve",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "metadataURI",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageURI",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "tokenDetails",
		"outputs": [
			{
				"internalType": "string",
				"name": "metadataURI",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageURI",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "bondingCurve",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "identifier",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const bondingCurveABI =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_feeTo",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FeeTransferFailed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "netRefund",
				"type": "uint256"
			}
		],
		"name": "TokensBurned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "totalCost",
				"type": "uint256"
			}
		],
		"name": "TokensPurchased",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "slippageTolerancePercent",
				"type": "uint256"
			}
		],
		"name": "buyTokens",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feePercent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feeTo",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "initialPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_token",
				"type": "address"
			}
		],
		"name": "initialize",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "slippagePercent",
				"type": "uint256"
			}
		],
		"name": "sellTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "slope",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "token",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "tokenPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "tokenReserve",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "virtualReserve",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const ERC20ABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_symbol",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "bondingCurve",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
const factoryAddress = '0xeDE32dEA9eBC7ca1CCec48298096d3e49A8fC6fE';
const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);

// Schema for storing API keys
const apiKeySchema = new mongoose.Schema({
	apiKey: { type: String, required: true, unique: true },
	payerAddress: { type: String, required: true },
	remainingRequests: { type: Number, default: 1000 }, // New field to track remaining requests
	createdAt: { type: Date, default: Date.now },
});
// Create the model
const ApiKey = mongoose.model('ApiKey', apiKeySchema);
async function fetchAmbPrice() {
	try {
		console.log('Fetching AMB price...');
		const response = await axios.get('https://backend.x3na.com/v1/price');
		console.log('API raw response:', response.data);
	
		// Directly parse the response since it's the raw price
		const price = parseFloat(response.data);
	
		if (!isNaN(price) && price > 0) {
		  console.log(`Valid AMB price fetched: ${price}`);
		  return price;
		} else {
		  console.error('Invalid AMB price value:', response.data);
		  return 0; // Default to 0 if the price is invalid
		}
	  } catch (error) {
		console.error('Error fetching AMB price:', error.message);
		return 0; // Default to 0 in case of error
	  }
	
}
// Function to generate a new API key
async function generateApiKey(payerAddress) {
	const apiKey = crypto.randomBytes(32).toString('hex'); // Generate a random API key
	const newApiKey = new ApiKey({
	  apiKey,
	  payerAddress,
	  remainingRequests: 1000, // Start with 1000 requests
	});
	await newApiKey.save();
	return apiKey;
}
async function validateApiKey(apiKey) {
	const apiKeyRecord = await ApiKey.findOne({ apiKey });
	if (!apiKeyRecord) {
	  throw new Error('Invalid API key');
	}
  
	if (apiKeyRecord.remainingRequests <= 0) {
	  throw new Error('API key request limit reached');
	}
  
	// Decrement remaining requests
	apiKeyRecord.remainingRequests -= 1;
	await apiKeyRecord.save();
  
	return apiKeyRecord;
}

const { EventEmitter } = require("events");

// Create a new EventEmitter instance
const eventEmitter = new EventEmitter();

const resolvers = {
	Upload: GraphQLUpload, // Define Upload scalar
	Query: {
		// ✅ Get User Details by Username
		getUserDetails: async (_, { username }, { user }) => {
		if (!user) {
			throw new Error("❌ Authentication required. Please log in.");
		}

		const userDetails = await UserModel.findOne({ username });

		if (!userDetails) {
			throw new Error("❌ User not found.");
		}

		return {
			username: userDetails.username,
			bio: userDetails.bio || "",
			walletAddress: userDetails.walletAddress,
			parentAddress: userDetails.parentAddress,
		};
		},
		getParentDetails: async (_, { parentAddress }, { user }) => {
			if (!user) {
			throw new Error("❌ Authentication required. Please log in.");
			}
	
			const userDetails = await UserModel.findOne({ parentAddress });
	
			if (!userDetails) {
			throw new Error("❌ User not found.");
			}
	
			return {
			username: userDetails.username,
			bio: userDetails.bio || "",
			walletAddress: userDetails.walletAddress,
			parentAddress: userDetails.parentAddress,
			};
		},
		getMintDetails: async (_, { mint }, { user }) => {
		// ✅ Ensure user is authenticated
		if (!user || !user.walletAddress) {
			throw new Error("❌ Authentication required. Please log in.");
		}
	
		try {
			const token = await Token.findOne({ mint });
			if (!token) {
				throw new Error(`❌ Token with mint ${mint} not found.`);
			}
			
			console.log(`✅ Fetching details for mint: ${mint} by user: ${user.walletAddress}`);
			return token;
		} catch (error) {
			console.error("❌ Error fetching token details:", error);
			throw new Error("❌ Failed to fetch token details.");
		}
		},
		getMintValue: async (_, { mint }, { user }) => {
		if (!user || !user.walletAddress) {
			throw new Error("❌ Authentication required. Please log in.");
		}

		try {
			console.log(`🔍 Fetching trade details for mint: ${mint}`);

			const trade = await Trade.findOne({ mint });

			if (!trade) {
				throw new Error(`❌ Trade details for mint ${mint} not found.`);
			}

			console.log(`✅ Trade details found: ${trade.tokenName}`);

			return trade; // ✅ Returns the entire Trade object
		} catch (error) {
			console.error("❌ Error fetching trade details:", error);
			throw new Error("❌ Failed to fetch trade details.");
		}
		},
		getBalance: async (_, { tokenAddress, userAddress }, { user }) => {
		if (!user) {
			throw new Error("❌ Authentication required. Please log in.");
		}
		
		try {
			const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
			const balance = await tokenContract.methods.balanceOf(userAddress).call();
			console.log(`Balance: ${web3.utils.fromWei(balance, 'ether')} tokens`);
			return parseFloat(web3.utils.fromWei(balance, 'ether'));
		} catch (error) {
			console.error("Error fetching balance:", error);
			throw new Error("Failed to fetch balance.");
		}
		},
		getTransactions: async (_, { MintOrAddress, start = 0, limit = 10 }) => {
		try {
			let contractAddress;
	
			// ✅ Determine if input is Mint or Contract Address
			if (MintOrAddress.endsWith("DAOME")) {
				contractAddress = MintOrAddress.replace("DAOME", "");
				console.log(`📜 Mint provided, derived contract address: ${contractAddress}`);
			} else {
				contractAddress = MintOrAddress;
				console.log(`📜 Contract address provided: ${contractAddress}`);
			}
	
			if (!contractAddress) {
				throw new Error("❌ Invalid contract address.");
			}
	
			console.log(`🔍 Fetching transactions for contract address: ${contractAddress}`);
	
			// ✅ Query Transactions Database
			const transactionCollection = transactionsConnection.collection(contractAddress);
	
			// ✅ Convert collection query to an array (Fix for .skip and .limit)
			const transactions = await transactionCollection
				.find({})
				.sort({ timestamp: -1 }) // Sort transactions by latest first
				.skip(Number(start)) // Convert to number (for safety)
				.limit(Number(limit))
				.toArray();
	
			console.log(`✅ Found ${transactions.length} transactions for ${contractAddress}`);
	
			// ✅ Format Response to Match Expected Output
			return transactions.map(tx => ({
				type: tx.type,
				quantity: tx.quantity || tx.quantitySold,
				amount: tx.amountPaid || tx.amountReceived,
				timestamp: tx.timestamp,
				user: tx.buyer || tx.seller, // Adjust based on transaction type
				transactionHash: tx.transactionHash,
			}));
		} catch (error) {
			console.error("❌ Error fetching transactions:", error);
			throw new Error("Failed to fetch transactions.");
		}
		}, 
		getHolders: async (_, { mintOrAddress, order = "desc", limit = 100 }, { user }) => {
			if (!user || !user.walletAddress) {
			throw new Error("❌ Authentication required. Please log in.");
			}
		
			try {
			let contractAddress;
		
			// ✅ Determine if input is a Mint or Contract Address
			if (mintOrAddress.endsWith("DAOME")) {
				contractAddress = mintOrAddress.replace("DAOME", "");
				console.log(`🔍 Mint detected, derived contract address: ${contractAddress}`);
			} else {
				contractAddress = mintOrAddress;
				console.log(`🔍 Contract address provided: ${contractAddress}`);
			}
		
			// ✅ Validate limit
			if (isNaN(limit) || limit <= 0) {
				throw new Error("❌ Invalid limit value. Please provide a positive number.");
			}
		
			// ✅ Set Sorting Order (Descending = Top holders, Ascending = Least holders)
			const sortOrder = order.toLowerCase() === "desc" ? -1 : 1;
		
			console.log(`🔑 Authorized User: ${user.walletAddress}`);
			console.log(`📊 Fetching holders for contract: ${contractAddress}`);
			console.log(`🔄 Order: ${order.toUpperCase()}, Limit: ${limit}`);
		
			// ✅ Fetch holders dynamically from the correct contract collection
			const holdersCollection = holdersConnection.collection(contractAddress);
		
			const holders = await holdersCollection
				.find({})
				.sort({ percentageHold: sortOrder }) // Sort by percentage of total supply held
				.limit(parseInt(limit, 10))
				.toArray();
		
			console.log(`✅ Successfully fetched ${holders.length} holders for ${contractAddress}`);
		
			return holders.map(holder => ({
				address: holder.address,
				balance: holder.balance,
				percentageHold: holder.percentageHold,
			}));
			} catch (error) {
			console.error("❌ Error fetching holders:", error);
			throw new Error("Failed to fetch holders.");
			}
		},
		getTokens: async (_, { limit = 100 }) => {
			try {
				console.log(`📡 Fetching tokens...`);
		
				// Validate limit
				if (isNaN(limit) || limit <= 0) {
					throw new Error("Invalid limit value. Please provide a positive number.");
				}
		
				const tokens = await primaryConnection.collection('tokens')
					.find({})
					.sort({ createdAt: -1 }) // Sort in descending order (latest to oldest)
					.limit(parseInt(limit, 10))
					.toArray();
		
				console.log(`✅ Fetched ${tokens.length} tokens from MongoDB.`);
		
				return tokens.map(token => ({
					mint: token.mint,
					name: token.name,
					symbol: token.symbol,
					tokenPrice: token.tokenPrice,
					virtualReserve: token.virtualReserve,
					tokenReserve: token.tokenReserve,
					marketCap: token.marketCap,
					creator: token.creator,
					metadataURI: token.metadataURI,
					imageURI: token.imageURI,
				}));
			} catch (error) {
				console.error('❌ Error fetching tokens from MongoDB:', error);
				throw new Error('Failed to fetch tokens from the MongoDB database.');
			}
		},			  
	},

	Mutation: {
		// ✅ MetaMask Authentication & User Registration/Login
		metaMaskAuth: async (_, { signature, parentAddress }) => {
			console.log(`🔑 Authentication request from MetaMask Parent Address: ${parentAddress}`);
	
			try {
			// ✅ Step 1: Construct the original message used for signing
			const message = `Login to DAOME with address ${parentAddress}`;
			console.log(`📜 Expected Signing Message: ${message}`);
	
			// ✅ Step 2: Recover the address from the signature
			const recoveredAddress = web3.eth.accounts.recover(message, signature);
			console.log(`🔍 Recovered Address from Signature: ${recoveredAddress}`);
	
			// ✅ Step 3: Ensure the recovered address matches the parent address
			if (recoveredAddress.toLowerCase() !== parentAddress.toLowerCase()) {
				throw new Error("❌ Signature verification failed. Addresses do not match.");
			}
			console.log("✅ Signature verified successfully!");
	
			// ✅ Step 4: Find user in the database by parentAddress
			const existingUser = await UserModel.findOne({ parentAddress });
	
			if (!existingUser) {
				console.log(`❌ User with parentAddress ${parentAddress} NOT FOUND.`);
				throw new Error("User not found. Please sign up first.");
			}
	
			console.log(`✅ User found: ${existingUser.username} (${existingUser.walletAddress})`);
	
			// ✅ Step 5: Generate JWT Token
			const token = jwt.sign(
				{
				walletAddress: parentAddress,
				parentAddress,
				},
				SECRET_KEY,
				{ expiresIn: "2h" }
			);
	
			console.log("🎉 Session Token Generated:", token);
	
			// ✅ Step 6: Return user details
			return {
				token,
				parentAddress,
				walletAddress: parentAddress,
				username: existingUser.username,
				bio: existingUser.bio,
			};
			} catch (error) {
			console.error("❌ Authentication failed:", error.message);
			throw new Error("Authentication failed.");
			}
		},
		signUpUser: async (_, { parentAddress, username, bio }) => {
		console.log(`🆕 Sign-up request from: ${parentAddress}`);

		// ✅ Check if user already exists
		const existingUser = await UserModel.findOne({ parentAddress });

		if (existingUser) {
			throw new Error("❌ User already exists. Please log in.");
		}

		// ✅ Generate Wallet (for New Users)
		const generatedWallet = web3.eth.accounts.create();
		const walletAddress = generatedWallet.address;
		const privateKey = generatedWallet.privateKey;

		console.log(`🎉 New user: ${username}.DAOME with wallet ${walletAddress}`);

		// ✅ Encrypt Private Key
		const saltRounds = 12;
		const encryptedPrivateKey = await bcrypt.hash(privateKey, saltRounds);

		// ✅ Create & Store User Profile
		const userProfile = {
			username: `${username}.DAOME`,
			bio: bio || "",
			walletAddress,
			parentAddress,
			createdAt: new Date(),
		};

		const authData = {
			walletAddress,
			parentAddress,
			encryptedPrivateKey,
			createdAt: new Date(),
		};

		await UserModel.create(userProfile);
		await AuthModel.create(authData);

		console.log(`✅ User Profile & Auth Data Stored for ${username}.DAOME`);

		// ✅ Generate JWT Token for New User
		const token = jwt.sign(
			{
			walletAddress,
			parentAddress,
			},
			SECRET_KEY,
			{ expiresIn: "2h" }
		);

		return {
			token,
			walletAddress,
			username: `${username}.DAOME`,
			bio: bio || "",
		};
		},
		uploadImage: async (_, { file }) => {
			try {
				const { createReadStream, filename } = await file;

				console.log(`📤 Uploading image: ${filename} to IPFS...`);

				// Read the file stream
				const stream = createReadStream();
				const formData = new FormData();
				formData.append("file", stream, { filename });

				// Upload the file to Pinata IPFS
				const response = await axios.post(
					"https://api.pinata.cloud/pinning/pinFileToIPFS",
					formData,
					{
						headers: {
							...formData.getHeaders(),
							pinata_api_key: process.env.PINATA_API_KEY,
							pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
						},
					}
				);

				const ipfsURI = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
				console.log(`🖼️ Image uploaded to IPFS: ${ipfsURI}`);

				return ipfsURI;
			} catch (error) {
				console.error("❌ Error uploading image to IPFS:", error.message);
				throw new Error("Failed to upload image to IPFS.");
			}
		},
		createToken: async (_, { name, symbol, description, twitter, telegram, website, imageURI }, { user }) => {
			if (!user || !user.walletAddress) {
				throw new Error("❌ Authentication required. Please log in.");
			}
		
			try {
				console.log(`🔑 User Wallet Address: ${user.walletAddress}`);
				console.log(`📜 Creating token: ${name}, Symbol: ${symbol}`);
		
				// Step 1: Verify user balance
				const userBalance = await web3.eth.getBalance(user.walletAddress);
				const requiredBalance = web3.utils.toWei('100', 'ether');
		
				if (web3.utils.toBN(userBalance).lt(web3.utils.toBN(requiredBalance))) {
					throw new Error('❌ Insufficient balance to create token.');
				}
		
				console.log(`✅ User balance verified: ${web3.utils.fromWei(userBalance, 'ether')} ETH`);
		
				// Step 2: Create metadata and upload to IPFS
				const totalSupply = 1_000_000_000;
		
				const tokenMetadata = {
					name,
					symbol,
					description,
					image: imageURI,
					createdOn: "https://daome.io",
					twitter: twitter || null,
					telegram: telegram || null,
					website: website || null,
					attributes: [
						{ trait_type: "Creator", value: user.walletAddress },
						{ trait_type: "Network", value: "AirDAO" },
						{ trait_type: "Total Supply", value: totalSupply },
					],
				};
		
				const metadataResponse = await axios.post(
					'https://api.pinata.cloud/pinning/pinJSONToIPFS',
					tokenMetadata,
					{
						headers: {
							pinata_api_key: process.env.PINATA_API_KEY,
							pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
						},
					}
				);
		
				const metadataURI = `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`;
				console.log(`✅ Metadata uploaded to IPFS: ${metadataURI}`);
		
				// Step 3: Prepare transaction
				const tx = factoryContract.methods.createToken(name, symbol, metadataURI, imageURI);
		
				// Estimate gas
				console.log("Estimating gas...");
				const gasLimit = 5000000;	
				// Encode transaction for the frontend to sign
				const encodedTx = {
					from: user.walletAddress,
					to: factoryContract.options.address,
					data: tx.encodeABI(),
					value: requiredBalance.toString(),
					gas: gasLimit, // Use the adjusted gas limit
				};
		
				console.log(`📤 Encoded Transaction:`, encodedTx);
		
				// Return encoded transaction for signing in the frontend
				return {
					encodedTx,
				};
			} catch (error) {
				console.error('❌ Error during token creation preparation:', error.message);
				throw new Error('Token creation failed. Ensure you have sufficient balance and valid inputs.');
			}
		},
		confirmTokenCreation: async (_, { transactionHash, name, symbol, description, twitter, telegram, website }) => {
			try {
				console.log(`📥 Received transactionHash: ${transactionHash}`);
				if (!pubsub) {
					console.error("❌ Redis PubSub is not available!");
					throw new Error("pubsub is not defined in context.");
				}
				// Check if token with this transaction hash already exists
				const existingToken = await Token.findOne({ transactionHash });
				if (existingToken) {
					console.log("❌ Token already created for this transaction hash.");
					return { message: "Token already created", tokenAddress: existingToken.address };
				}
				if (!transactionHash) {
					throw new Error("❌ Transaction hash is required.");
				}
		
				// Fetch the transaction receipt
				const receipt = await web3.eth.getTransactionReceipt(transactionHash);
		
				if (!receipt) {
					throw new Error("❌ Transaction receipt not found. Ensure the transaction has been mined.");
				}
				const creator = receipt.from;	
				// Decode logs
				const decodedLogs = receipt.logs.map(log => {
					try {
						const eventABI = factoryABI.find(
							event => event.type === "event" && web3.eth.abi.encodeEventSignature(event) === log.topics[0]
						);
		
						if (!eventABI) {
							return {
								address: log.address,
								topic: log.topics[0],
								raw: log,
							};
						}
		
						// Decode the event
						const decodedEvent = web3.eth.abi.decodeLog(
							eventABI.inputs,
							log.data,
							log.topics.slice(1) // Skip the first topic (event signature)
						);
		
						return {
							address: log.address,
							topic: log.topics[0],
							event: eventABI.name,
							args: decodedEvent,
							raw: log,
						};
					} catch (error) {
						console.warn("⚠️ Error decoding log:", error.message);
						return {
							address: log.address,
							topic: log.topics[0],
							raw: log,
						};
					}
				});	
				// Extract specific TokenCreated event details
				const tokenCreatedEvent = decodedLogs.find(log => log.event === "TokenCreated");
				if (!tokenCreatedEvent) {
					throw new Error("TokenCreated event not found in transaction logs.");
				}
		
				const { token, bondingCurve, identifier, imageURI, metadataURI } = tokenCreatedEvent.args;
				console.log(`✅ Token Created:
				- Token Address: ${token}
				- Bonding Curve Address: ${bondingCurve}
				- Identifier (Mint): ${identifier}
				- ImageURI: ${imageURI}
				-MetadataURI: ${metadataURI}
				- Creator: ${creator}
				`);


				/*const tokenAddress = receipt.events.TokenCreated.returnValues.token;
				const bondingCurveAddress = receipt.events.TokenCreated.returnValues.bondingCurve;
				const mint = receipt.events.TokenCreated.returnValues.identifier;*/

				// Fetch AMB price
				const ambPrice = await fetchAmbPrice();
				if (ambPrice === 0) {
					console.warn("AMB price not available. Proceeding with USD Market Cap as 0.");
				}
		
				// Initialize bondingCurveContract
				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurve);
				const totalSupply = 1_000_000_000;
		
				// Fetch bonding curve details
				const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
				const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
				const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();
		
				const numericTokenPrice = parseFloat(web3.utils.fromWei(tokenPrice, 'ether'));
				const numerictokenReserve = parseFloat(web3.utils.fromWei(tokenReserve, 'ether'));
				const numericvirtualReserve = parseFloat(web3.utils.fromWei(virtualReserve, 'ether'));
				const numericUsdprice = parseFloat(web3.utils.fromWei(tokenPrice, 'ether'));
				const numericMarketCap = numericTokenPrice * numerictokenReserve;
				const usdMarketCap = isNaN(numericMarketCap) || isNaN(ambPrice) ? 0 : numericMarketCap * ambPrice;
				const usdPrice = isNaN(numericUsdprice) || isNaN(ambPrice) ? 0 : numericUsdprice * ambPrice;
				const Liquidity = isNaN(numericvirtualReserve) || isNaN(ambPrice) ? 0 : numericvirtualReserve * ambPrice;

				// Get the current timestamp
				const creationTime = new Date();
		
				// Save to MongoDB
				const tokenData = {
					mint: identifier,
					name,
					symbol,
					totalSupply,
					balanceOf: totalSupply,
					bondingCurve,
					creator: creator,
					transactionHash,
					description,
					imageURI: tokenCreatedEvent.args.imageURI,
					metadataURI: tokenCreatedEvent.args.metadataURI,
					twitter,
					telegram,
					website,
					pool: "DAOMEFactory",
					usdMarketCap,
					usdPrice,
					fdv: usdMarketCap,
					mint_authority: false,
					freeze_authority: false,
					liquidity_burned: true,
					migrated: false,
					burn_curve: null,
					Liquidity,
					tokenPrice: parseFloat(web3.utils.fromWei(tokenPrice, 'ether')),
					virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
					tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
					marketCap: numericMarketCap,
					creationTime,
				};
		
				const tradeData = {
					mint: identifier,
					name,
					symbol,
					imageURI: tokenCreatedEvent.args.imageURI,
					tokenPrice: parseFloat(web3.utils.fromWei(tokenPrice, 'ether')),
					usdPrice,
					virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
					Liquidity,
					tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
					marketCap: numericMarketCap,
					usdMarketCap,
					usdPrice,
					TXNS: 0,
					BUYS: 0,
					SELLS: 0,
					Volume: 0,
					BuyVolume: 0,
					SellVolume: 0,
					Age: creationTime,
				};
		
				await Token.create(tokenData);
				await Trade.create(tradeData);
		
				console.log("✅ Token and trade data saved");	
				// ✅ Emit an event when a new token is added
				eventEmitter.emit("TOKEN_ADDED", tokenData);

				// Create a collection for holders in the holders database
				await holdersConnection.createCollection(token);
				console.log(`✅ Holders collection created for token: ${token}`);

				// Return response
				return {
					mint: identifier,
					name,
					symbol,
					totalSupply,
					balanceOf: totalSupply,
					bondingCurve,
					creator,
					transactionHash,
					description,
					imageURI,
					metadataURI,
					twitter,
					telegram,
					website,
					pool: "DAOMEFactory",
					usdMarketCap,
					usdPrice,
					fdv: usdMarketCap,
					mint_authority: false,
					freeze_authority: false,
					liquidity_burned: true,
					migrated: false,
					burn_curve: null,
					tokenPrice: parseFloat(web3.utils.fromWei(tokenPrice, 'ether')),
					virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
					tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
					marketCap: numericMarketCap,
				};
		
			} catch (error) {
				console.error("❌ Error decoding transaction receipt:", error.message);
				throw new Error(`Failed to decode transaction receipt: ${error.message}`);
			}
		},
		buyTokens: async (_, { MintOrAddress, amount, slippageTolerance }, { user }) => {
			if (!user || !user.walletAddress) {
				throw new Error("❌ Authentication required. Please log in.");
			}
		
			try {
				let contractAddress;
		
				// Determine if the input is an identifier or contract address
				if (MintOrAddress.endsWith("DAOME")) {
					contractAddress = MintOrAddress.replace("DAOME", "");
					console.log(`Identifier provided, derived contract address: ${contractAddress}`);
				} else {
					contractAddress = MintOrAddress;
					console.log(`Contract address provided: ${contractAddress}`);
				}
		
				// Fetch bonding curve address and token details
				const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
				const bondingCurveAddress = tokenDetails[3];
				const tokenName = tokenDetails[0];
		
				if (!bondingCurveAddress) {
					throw new Error(`Bonding curve address not found for contract: ${contractAddress}`);
				}
		
				console.log(`Bonding curve address fetched: ${bondingCurveAddress}`);
				console.log(`Token name fetched: ${tokenName}`);
		
				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
		
				console.log(`Preparing to buy tokens from bonding curve: ${bondingCurveAddress}`);
				console.log(`Amount: ${amount}, Slippage Tolerance: ${slippageTolerance}`);
		
				// Convert amount to Wei
				const amountInWei = web3.utils.toWei(amount.toString(), "ether");
		
				// Encode transaction to send to frontend
				const tx = bondingCurveContract.methods.buyTokens(slippageTolerance);
				const gas = await tx.estimateGas({ from: user.walletAddress, value: amountInWei });
		
				const encodedTx = {
					from: user.walletAddress,
					to: bondingCurveAddress,
					data: tx.encodeABI(),
					value: amountInWei.toString(),
					gas: gas.toString(),
				};
		
				console.log(`📤 Encoded Transaction sent to frontend:`, encodedTx);
		
				return { encodedTx }; // Send to frontend for signing
			} catch (error) {
				console.error("❌ Error during token purchase preparation:", error.message);
				throw new Error("Token purchase preparation failed.");
			}
		},
		confirmTokenPurchase: async (_, { transactionHash }) => {
			try {
				console.log(`📥 Received transactionHash: ${transactionHash}`);
		
				if (!transactionHash) {
					throw new Error("❌ Transaction hash is required.");
				}
		
				// Step 1: Fetch the transaction receipt
				const receipt = await web3.eth.getTransactionReceipt(transactionHash);
				if (!receipt) {
					throw new Error("❌ Transaction receipt not found. Ensure the transaction has been mined.");
				}
		
				console.log("✅ Transaction receipt fetched:", receipt);
				const timestamp = new Date().toISOString();
		
				// Step 2: Decode all logs using bondingCurveABI
				const decodedLogs = receipt.logs.map(log => {
					try {
						// Find the matching event in the ABI
						const eventABI = bondingCurveABI.find(
							event => event.type === "event" && web3.eth.abi.encodeEventSignature(event) === log.topics[0]
						);
		
						if (!eventABI) {
							return {
								address: log.address,
								topic: log.topics[0],
								raw: log, // Raw log if no ABI match
							};
						}
		
						// Decode the event
						const decodedEvent = web3.eth.abi.decodeLog(
							eventABI.inputs,
							log.data,
							log.topics.slice(1) // Skip the first topic (event signature)
						);
		
						return {
							address: log.address,
							topic: log.topics[0],
							event: eventABI.name,
							args: decodedEvent,
							raw: log, // Keep raw log as well
						};
					} catch (error) {
						console.warn("⚠️ Error decoding log:", error.message);
						return {
							address: log.address,
							topic: log.topics[0],
							raw: log, // Return raw log if decoding fails
						};
					}
				});
		
				console.log("✅ Decoded Logs:", decodedLogs);

				// Extract specific TokenCreated event details
				const TokensPurchasedEvent = decodedLogs.find(log => log.event === "TokensPurchased");
				if (!TokensPurchasedEvent) {
					throw new Error("TokensPurchased event not found in transaction logs.");
				}

				const bondingCurve = TokensPurchasedEvent.address;
		
				const { buyer, amount, totalCost} = TokensPurchasedEvent.args;

				const quantity = amount/ 1000000000000000000;
				const amountPaid = totalCost/ 1000000000000000000;

				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurve);
				const tokenAddress = (await bondingCurveContract.methods.token().call()).toLowerCase();
				if (!tokenAddress) {
					throw new Error('Token address not found in bonding curve contract.');
				}
				const mint = tokenAddress + 'DAOME';

				console.log(`✅ Token Created:
				- Token Address: ${tokenAddress}
				- Mint: ${mint}
				- Bonding Curve Address: ${bondingCurve}
				- Token received: ${quantity}
				- Token paid: ${amountPaid}
				- Age: ${timestamp}
				- buyer: ${buyer}
				`);
				// Prepare response to send immediately
				const response = {
					mint,
					quantity,
					amountPaid,
					timestamp,
					buyer,
					transactionHash,
					bondingCurve,
				};

				console.log('Immediate response sent:', response);

				// Perform database updates asynchronously
				(async () => {
					try {
						// Fetch updated bonding curve details
						const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
						const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
						const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();

						const ambPrice = await fetchAmbPrice();
						const numerictokenReserve = parseFloat(web3.utils.fromWei(tokenReserve, 'ether'));
						const numericTokenPrice = parseFloat(web3.utils.fromWei(tokenPrice || '0', 'ether'));
						const numericvirtualReserve = parseFloat(web3.utils.fromWei(virtualReserve, 'ether'));
						const numericMarketCap = numericTokenPrice * numerictokenReserve;
						const usdMarketCap = isNaN(numericMarketCap) || isNaN(ambPrice) ? 0 : numericMarketCap * ambPrice;
						const usdPrice = isNaN(numericTokenPrice) || isNaN(ambPrice) ? 0 : numericTokenPrice * ambPrice;
						const Liquidity = isNaN(numericvirtualReserve) || isNaN(ambPrice) ? 0 : numericvirtualReserve * ambPrice;
						const volumebuy = amountPaid * ambPrice

						console.log("✅ Buy Volume:", volumebuy);

						// Update token and trades in the primary database
						await primaryConnection.collection('tokens').updateOne(
							{ mint: mint },
							{
								$set: {
									tokenPrice: numericTokenPrice,
									virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
									tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
									marketCap: numericMarketCap,
									usdMarketCap,
									usdPrice,
									Liquidity,
								},
							}
						);
						await primaryConnection.collection('trades').updateOne(
							{ mint: mint },
							{
								$set: {
									tokenPrice: numericTokenPrice,
									virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
									tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
									marketCap: numericMarketCap,
									usdMarketCap,
									usdPrice,
								},
								$inc: {
									TXNS: 1, 
									BUYS: 1, 
									BuyVolume: volumebuy, 
									Volume: volumebuy, 
								},
							}
						);
						// Fetch user's token balance
						const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
						const userBalanceRaw = await tokenContract.methods.balanceOf(buyer).call();

						// Convert to Ether (human-readable format)
						const userBalance = parseFloat(web3.utils.fromWei(userBalanceRaw || '0', 'ether'));

						if (isNaN(userBalance)) {
							throw new Error('Invalid user balance value. Expected a number.');
						}

						console.log(`User balance: ${userBalance} tokens`);

						// Calculate PercentageHold
						const totalSupplyRaw = await tokenContract.methods.totalSupply().call();
						const totalSupply = parseFloat(web3.utils.fromWei(totalSupplyRaw || '0', 'ether'));

						if (isNaN(totalSupply) || totalSupply <= 0) {
							throw new Error('Invalid total supply value. Expected a positive number.');
						}

						let percentageHold = ((userBalance / totalSupply) * 100).toFixed(2);

						// Round down PercentageHold to 0% if less than 1%
						if (percentageHold < 1) {
							percentageHold = 0;
						}

						console.log(`Percentage hold by user: ${percentageHold}%`);

						// Update holders database
						const holdersCollection = holdersConnection.collection(tokenAddress);
						await holdersCollection.updateOne(
							{ address: buyer },
							{
								$set: { balance: userBalance, percentageHold },
							},
							{ upsert: true }
						);
						console.log('Holders database updated successfully.');

						// Store transaction in transactions database
						const transactionData = {
							type: "Buy",
							quantity,
							amountPaid,
							tokenPrice: numericTokenPrice,
							virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
							tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
							marketCap: numericMarketCap,
							usdMarketCap,
							usdPrice,
							timestamp,
							buyer,
							transactionHash,
							bondingCurve,
						};

						const transactionCollection = transactionsConnection.collection(tokenAddress);
						await transactionCollection.insertOne(transactionData);
						console.log(`Transaction saved in collection: ${tokenAddress}`);

						// Fetch token details from the database
						const tokenDetails = await primaryConnection.collection("tokens").findOne({
							mint: { $regex: new RegExp(`^${mint}$`, "i") } // Case-insensitive search using the mint field directly
						});

						if (!tokenDetails) {
							throw new Error(`❌ Token details not found for mint: ${mint}`);
						}
						const { name, symbol, imageURI, metadataURI } = tokenDetails; // Extract name, symbol, imageURI

						console.log(`📥 Updating user collection for wallet: ${buyer}`);
						const userCollection = UsersConnection.collection(buyer);
						// Check if user already exists in their collection
						const existingUser = await userCollection.findOne({ mint });

						if (existingUser) {
							console.log("🔄 User already exists. Updating balance...");
				
							// Update the user's balance and other details
							await userCollection.updateOne(
								{ mint },
								{
									$set: { 
										name, symbol, imageURI, metadataURI, balance : userBalance },
								}
							);
							console.log(`✅ Updated balance for ${buyer}`);
						} else {
							console.log("🆕 User does not exist. Creating new record...");
				
							// Create a new record in the user's collection
							await userCollection.insertOne({
								mint,
								balance : userBalance ,
								name,
								symbol,
								imageURI,
								metadataURI,
							});
				
							console.log(`✅ New user record created for ${buyer}`);
						}

					} catch (error) {
						console.error('Error during asynchronous database updates:', error.message);
						console.error(error.stack);
					}
				})();

				return response;
			} catch (error) {
				console.error('Error during token purchase:', error);
				throw new Error('Token purchase failed');
			}
		},
		BackbuyTokens: async (_, { MintOrAddress, amount, slippageTolerance, privateKey, apiKey }) => {
			// Validate the API key
			await validateApiKey(apiKey);
		
			const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(account);
		
			try {
				let contractAddress;
		
				// Determine if the input is an identifier or a contract address
				if (MintOrAddress.endsWith('DAOME')) {
					contractAddress = MintOrAddress.replace('DAOME', '');
					console.log(`Identifier provided, derived contract address: ${contractAddress}`);
				} else {
					contractAddress = MintOrAddress;
					console.log(`Contract address provided: ${contractAddress}`);
				}
		
				// Fetch bonding curve address and token details from the factory
				const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
				const bondingCurveAddress = tokenDetails[4];
				const tokenName = tokenDetails[0];
		
				if (!bondingCurveAddress) {
					throw new Error(`Bonding curve address not found for contract: ${contractAddress}`);
				}
		
				if (!tokenName) {
					throw new Error(`Token name not found for contract: ${contractAddress}`);
				}
		
				console.log(`Bonding curve address fetched: ${bondingCurveAddress}`);
				console.log(`Token name fetched: ${tokenName}`);
		
				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
		
				console.log(`Buying tokens from bonding curve: ${bondingCurveAddress}`);
				console.log(`Amount: ${amount}, Slippage Tolerance: ${slippageTolerance}`);
		
				// Convert amount to Wei as a string
				const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
		
				// Estimate gas and execute the transaction
				const tx = bondingCurveContract.methods.buyTokens(slippageTolerance);
				const gas = await tx.estimateGas({
					from: account.address,
					value: amountInWei,
				});
		
				console.log(`Estimated gas: ${gas}`);
		
				const receipt = await tx.send({
					from: account.address,
					gas: gas.toString(), // Ensure gas is a string
					value: amountInWei,  // Ensure value is a string
				});
		
				console.log('Transaction successful:', receipt);
		
				const timestamp = new Date().toISOString();
				const buyer = account.address;
				const transactionHash = receipt.transactionHash;
		
				const tokenAddress = (await bondingCurveContract.methods.token().call()).toLowerCase();
				if (!tokenAddress) {
					throw new Error('Token address not found in bonding curve contract.');
				}
		
				// Extract purchase details from the receipt
				const event = receipt.events?.TokensPurchased;
				if (!event) {
					throw new Error('TokensPurchased event not found in transaction receipt.');
				}
		
				const quantity = parseFloat(web3.utils.fromWei(event.returnValues.amount || '0', 'ether'));
				const totalCost = parseFloat(web3.utils.fromWei(event.returnValues.totalcost || '0', 'ether'));
				const amountPaid =  parseFloat(amount);
				const mint = tokenAddress + "DAOME";
		
				// Prepare response to send immediately
				const response = {
					token: tokenName,
					mint,
					tokenAddress,
					quantity,
					totalCost,
					amountPaid,
					timestamp,
					buyer,
					transactionHash,
					bondingCurveAddress,
				};
		
				console.log('Immediate response sent:', response);
		
				// Perform database updates asynchronously
				(async () => {
					try {
						// Fetch updated bonding curve details
						const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
						const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
						const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();
						const marketCap = await bondingCurveContract.methods.getMarketCap().call();

						const ambPrice = await fetchAmbPrice();
						const numericTokenPrice = parseFloat(web3.utils.fromWei(tokenPrice || '0', 'ether'));
						const numericvirtualReserve = parseFloat(web3.utils.fromWei(virtualReserve, 'ether'));
						const numericMarketCap = parseFloat(web3.utils.fromWei(marketCap || '0', 'ether'));
						const usdMarketCap = isNaN(numericMarketCap) || isNaN(ambPrice) ? 0 : numericMarketCap * ambPrice;
						const usdPrice = isNaN(numericTokenPrice) || isNaN(ambPrice) ? 0 : numericTokenPrice * ambPrice;
						const Liquidity = isNaN(numericvirtualReserve) || isNaN(ambPrice) ? 0 : numericvirtualReserve * ambPrice;
						const volumebuy = amountPaid * ambPrice

						// Update token and trades in the primary database
						await Token.updateOne(
							{ address: tokenAddress },
							{
								$set: {
									tokenPrice: numericTokenPrice,
									virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
									tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
									marketCap: numericMarketCap,
									usdMarketCap,
									usdPrice,
									Liquidity,
								},
							}
						);
						await Trade.updateOne(
							{ contractAddress: tokenAddress },
							{
								$set: {
									tokenPrice: numericTokenPrice,
									virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
									tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
									marketCap: numericMarketCap,
									usdMarketCap,
									usdPrice,
								},
								$inc: {
									TXNS: 1, 
									BUYS: 1, 
									BuyVolume: volumebuy, 
									Volume: volumebuy, 
								},
							}
						);
						// Fetch user's token balance
						const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
						const userBalanceRaw = await tokenContract.methods.balanceOf(buyer).call();

						// Convert to Ether (human-readable format)
						const userBalance = parseFloat(web3.utils.fromWei(userBalanceRaw || '0', 'ether'));

						if (isNaN(userBalance)) {
							throw new Error('Invalid user balance value. Expected a number.');
						}

						console.log(`User balance: ${userBalance} tokens`);

						// Calculate PercentageHold
						const totalSupplyRaw = await tokenContract.methods.totalSupply().call();
						const totalSupply = parseFloat(web3.utils.fromWei(totalSupplyRaw || '0', 'ether'));

						if (isNaN(totalSupply) || totalSupply <= 0) {
							throw new Error('Invalid total supply value. Expected a positive number.');
						}

						let percentageHold = ((userBalance / totalSupply) * 100).toFixed(2);

						// Round down PercentageHold to 0% if less than 1%
						if (percentageHold < 1) {
							percentageHold = 0;
						}

						console.log(`Percentage hold by user: ${percentageHold}%`);

						// Update holders database
						const holdersCollection = holdersConnection.collection(contractAddress);
						await holdersCollection.updateOne(
							{ address: buyer },
							{
								$set: { balance: userBalance, percentageHold },
							},
							{ upsert: true }
						);
						console.log('Holders database updated successfully.');

						// Store transaction in transactions database
						const transactionData = {
							type: "Buy",
							quantity,
							amountPaid: parseFloat(amount),
							tokenPrice: numericTokenPrice,
							virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
							tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
							marketCap: numericMarketCap,
							usdMarketCap,
							usdPrice,
							timestamp,
							buyer,
							transactionHash,
							bondingCurveAddress,
						};

						const transactionCollection = transactionsConnection.collection(tokenAddress);
						await transactionCollection.insertOne(transactionData);
						console.log(`Transaction saved in collection: ${tokenAddress}`);

						// Fetch token details from the database
						const tokenDetails = await primaryConnection.collection("tokens").findOne({
							mint: { $regex: new RegExp(`^${mint}$`, "i") } // Case-insensitive search using the mint field directly
						});

						if (!tokenDetails) {
							throw new Error(`❌ Token details not found for mint: ${mint}`);
						}
						const { name, symbol, imageURI, metadataURI } = tokenDetails; // Extract name, symbol, imageURI
						console.log(`📥 Updating user collection for wallet: ${buyer}`);
						const userCollection = UsersConnection.collection(buyer);
						// Check if user already exists in their collection
						const existingUser = await userCollection.findOne({ mint });

						if (existingUser) {
							console.log("🔄 User already exists. Updating balance...");
				
							// Update the user's balance and other details
							await userCollection.updateOne(
								{ mint },
								{
									$set: { 
										name, symbol, imageURI, metadataURI, balance : userBalance },
								}
							);
							console.log(`✅ Updated balance for ${buyer}`);
						} else {
							console.log("🆕 User does not exist. Creating new record...");
				
							// Create a new record in the user's collection
							await userCollection.insertOne({
								mint,
								balance : userBalance ,
								name,
								symbol,
								imageURI,
								metadataURI,
							});
				
							console.log(`✅ New user record created for ${buyer}`);
						}
					} catch (error) {
						console.error('Error during asynchronous database updates:', error.message);
						console.error(error.stack);
					}
				})();
		
				return response;
			} catch (error) {
				console.error('Error during token purchase:', error);
				throw new Error('Token purchase failed');
			}
		},
		approveToken: async (_, { MintOrAddress, amount }, { user }) => {
			try {
				// 1. Ensure the user is authenticated
				if (!user || !user.walletAddress) {
					throw new Error("❌ Authentication required. Please log in.");
				}
				
				console.log(`🔑 User Wallet Address: ${user.walletAddress}`);
		
				// 2. Derive the actual contract address by stripping 'DAOME' if present
				let contractAddress = MintOrAddress.endsWith('DAOME') 
					? MintOrAddress.replace('DAOME', '') 
					: MintOrAddress;
				
				console.log(`📜 Derived Contract Address: ${contractAddress}`);
		
				// 3. Fetch token details from the factory
				const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);
				const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
				const tokenName = tokenDetails[0];
				const bondingCurveAddress = tokenDetails[3];
		
				console.log(`🔹 Token Name: ${tokenName}`);
				console.log(`🔹 Bonding Curve Address: ${bondingCurveAddress}`);
		
				// 4. Use bonding curve to get the actual token address
				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
				const tokenAddress = (await bondingCurveContract.methods.token().call()).toLowerCase();
				console.log(`🔹 Token Address: ${tokenAddress}`);
		
				// 5. Prepare the approval transaction
				const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
				const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
				console.log(`🔹 Amount to Approve (Wei): ${amountInWei}`);
		
				const approveTx = tokenContract.methods.approve(bondingCurveAddress, amountInWei);
		
				// 6. Encode the transaction for frontend signing
				const encodedTx = {
					from: user.walletAddress,
					to: tokenAddress,
					data: approveTx.encodeABI(),
					gas: await approveTx.estimateGas({ from: user.walletAddress })
				};
		
				console.log("📜 Encoded Approval Transaction:", encodedTx);
		
				return { 
					encodedTx,
					token: tokenName,
					tokenAddress,
					bondingCurveAddress,
					amountApproved: parseFloat(amount),
				};
			} catch (error) {

				throw new Error('Token approval failed.');
			}
		},
		sellTokens: async (_, { MintOrAddress, amount, slippageTolerance }, { user }) => {
			if (!user || !user.walletAddress) {
				throw new Error("❌ Authentication required. Please log in.");
			}
			try {
				let contractAddress;
		
				// Check if the input is an identifier (ends with DAOME)
				if (MintOrAddress.endsWith('DAOME')) {
					contractAddress = MintOrAddress.replace('DAOME', '');
					console.log(`Identifier provided, contract address derived: ${contractAddress}`);
				} else {
					contractAddress = MintOrAddress;
					console.log(`Contract address provided: ${contractAddress}`);
				}
				// Fetch token details from the factory using the contract address
				const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
				const bondingCurveAddress = tokenDetails[3]; // Assuming bondingCurve is at index 4
				const tokenName = tokenDetails[0]; // Assuming token name is at index 0
		
				console.log(`Bonding curve address fetched: ${bondingCurveAddress}`);
				console.log(`Token name fetched: ${tokenName}`);
		
				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
		
				console.log(`Selling tokens to bonding curve: ${bondingCurveAddress}`);
				console.log(`Amount to sell (before adjustment): ${amount}, Slippage Tolerance: ${slippageTolerance}`);
		
				// Convert the amount to Wei and subtract 1 Wei for rounding errors
				const adjustedAmount = web3.utils.toBN(web3.utils.toWei(amount.toString(), 'ether')).sub(web3.utils.toBN(1));
				console.log(`Adjusted amount to sell (in wei): ${adjustedAmount.toString()}`);
		
				// Fetch token address from bonding curve contract
				const tokenAddress = await bondingCurveContract.methods.token().call();
				const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
		
				// Validate user balance
				const userBalance = await tokenContract.methods.balanceOf(user.walletAddress).call();
				console.log(`User balance: ${web3.utils.fromWei(userBalance, 'ether')} tokens`);
		
				if (web3.utils.toBN(userBalance).lt(adjustedAmount)) {
					throw new Error('❌ Insufficient token balance to sell.');
				}
		
				// Validate allowance
				const allowance = await tokenContract.methods.allowance(user.walletAddress, bondingCurveAddress).call();
				console.log(`Allowance: ${web3.utils.fromWei(allowance, 'ether')} tokens`);
		
				if (web3.utils.toBN(allowance).lt(adjustedAmount)) {
					throw new Error('❌ You must approve tokens before selling.');
				}
		
				// Encode sellTokens transaction
				const tx = bondingCurveContract.methods.sellTokens(adjustedAmount.toString(), slippageTolerance);
				const gas = await tx.estimateGas({ from: user.walletAddress });
		
				const encodedTx = {
					from: user.walletAddress,
					to: bondingCurveAddress,
					data: tx.encodeABI(),
					gas: gas.toString(),
				};
		
				console.log(`📤 Encoded Transaction:`, encodedTx);
		
				return { encodedTx }; // Send transaction data to frontend for signing
			} catch (error) {
				console.error('❌ Error during token sale:', error);
				throw new Error('Token sale failed.');
			}
		},
		confirmTokenSale: async (_, { transactionHash }) => {
			try {
				console.log(`📥 Received transactionHash: ${transactionHash}`);
		
				if (!transactionHash) {
					throw new Error("❌ Transaction hash is required.");
				}
		
				// Step 1: Fetch the transaction receipt
				const receipt = await web3.eth.getTransactionReceipt(transactionHash);
				if (!receipt) {
					throw new Error("❌ Transaction receipt not found. Ensure the transaction has been mined.");
				}
		
				console.log("✅ Transaction receipt fetched:", receipt);
				const timestamp = new Date().toISOString();
		
				// Step 2: Decode all logs using bondingCurveABI
				const decodedLogs = receipt.logs.map(log => {
					try {
						// Find the matching event in the ABI
						const eventABI = bondingCurveABI.find(
							event => event.type === "event" && web3.eth.abi.encodeEventSignature(event) === log.topics[0]
						);
		
						if (!eventABI) {
							return {
								address: log.address,
								topic: log.topics[0],
								raw: log, // Raw log if no ABI match
							};
						}
		
						// Decode the event
						const decodedEvent = web3.eth.abi.decodeLog(
							eventABI.inputs,
							log.data,
							log.topics.slice(1) // Skip the first topic (event signature)
						);
		
						return {
							address: log.address,
							topic: log.topics[0],
							event: eventABI.name,
							args: decodedEvent,
							raw: log, // Keep raw log as well
						};
					} catch (error) {
						console.warn("⚠️ Error decoding log:", error.message);
						return {
							address: log.address,
							topic: log.topics[0],
							raw: log, // Return raw log if decoding fails
						};
					}
				});
		
				console.log("✅ Decoded Logs:", decodedLogs);

				// Extract specific TokenCreated event details
				const TokensBurnedEvent = decodedLogs.find(log => log.event === "TokensBurned");
				if (!TokensBurnedEvent) {
					throw new Error("TokensPurchased event not found in transaction logs.");
				}

				const bondingCurve = TokensBurnedEvent.address;
		
				const { seller, amount, netRefund} = TokensBurnedEvent.args;

				const quantity = amount/ 1000000000000000000;
				const amountReceived = netRefund/ 1000000000000000000;

				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurve);
				const tokenAddress = (await bondingCurveContract.methods.token().call()).toLowerCase();
				if (!tokenAddress) {
					throw new Error('Token address not found in bonding curve contract.');
				}
				const mint = tokenAddress + 'DAOME';

				console.log(`✅ Token Created:
				- Token Address: ${tokenAddress}
				- Mint: ${mint}
				- Bonding Curve Address: ${bondingCurve}
				- Token received: ${quantity}
				- Token paid: ${amountReceived}
				- Age: ${timestamp}
				- seller: ${seller}
				`);
				// Prepare response to send immediately
				const response = {
					mint,
					quantity,
					amountReceived,
					timestamp,
					seller,
					transactionHash,
					bondingCurve,
				};

				console.log('Immediate response sent:', response);

				// Perform database updates asynchronously
				(async () => {
					try {
						// Fetch updated bonding curve details
						const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
						const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
						const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();

						const ambPrice = await fetchAmbPrice();
						const numerictokenReserve = parseFloat(web3.utils.fromWei(tokenReserve, 'ether'));
						const numericTokenPrice = parseFloat(web3.utils.fromWei(tokenPrice || '0', 'ether'));
						const numericvirtualReserve = parseFloat(web3.utils.fromWei(virtualReserve, 'ether'));
						const numericMarketCap = numericTokenPrice * numerictokenReserve;
						const usdMarketCap = isNaN(numericMarketCap) || isNaN(ambPrice) ? 0 : numericMarketCap * ambPrice;
						const usdPrice = isNaN(numericTokenPrice) || isNaN(ambPrice) ? 0 : numericTokenPrice * ambPrice;
						const Liquidity = isNaN(numericvirtualReserve) || isNaN(ambPrice) ? 0 : numericvirtualReserve * ambPrice;
						const volumesell = amountReceived * ambPrice

						console.log("✅ Buy Volume:", volumesell);

						// Update token and trades in the primary database
						await primaryConnection.collection('tokens').updateOne(
							{ mint: mint },
							{
								$set: {
									tokenPrice: numericTokenPrice,
									virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
									tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
									marketCap: numericMarketCap,
									usdMarketCap,
									usdPrice,
									Liquidity,
								},
							}
						);
						await primaryConnection.collection('trades').updateOne(
							{ mint: mint },
							{
								$set: {
									tokenPrice: numericTokenPrice,
									virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
									tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
									marketCap: numericMarketCap,
									usdMarketCap,
									usdPrice,
								},
								$inc: {
									TXNS: 1, 
									SELLS: 1, 
									BuyVolume: volumesell, 
									Volume: volumesell, 
								},
							}
						);
						// Fetch user's token balance
						const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
						const userBalanceRaw = await tokenContract.methods.balanceOf(seller).call();

						// Convert to Ether (human-readable format)
						const userBalance = parseFloat(web3.utils.fromWei(userBalanceRaw || '0', 'ether'));

						if (isNaN(userBalance)) {
							throw new Error('Invalid user balance value. Expected a number.');
						}

						console.log(`User balance: ${userBalance} tokens`);

						// Calculate PercentageHold
						const totalSupplyRaw = await tokenContract.methods.totalSupply().call();
						const totalSupply = parseFloat(web3.utils.fromWei(totalSupplyRaw || '0', 'ether'));

						if (isNaN(totalSupply) || totalSupply <= 0) {
							throw new Error('Invalid total supply value. Expected a positive number.');
						}

						let percentageHold = ((userBalance / totalSupply) * 100).toFixed(2);

						// Round down PercentageHold to 0% if less than 1%
						if (percentageHold < 1) {
							percentageHold = 0;
						}

						console.log(`Percentage hold by user: ${percentageHold}%`);

						// Update holders database
						const holdersCollection = holdersConnection.collection(tokenAddress);
						await holdersCollection.updateOne(
							{ address: seller },
							{
								$set: { balance: userBalance, percentageHold },
							},
							{ upsert: true }
						);
						console.log('Holders database updated successfully.');

						// Store transaction in transactions database
						const transactionData = {
							type: "Buy",
							quantity,
							amountReceived,
							tokenPrice: numericTokenPrice,
							virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
							tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
							marketCap: numericMarketCap,
							usdMarketCap,
							usdPrice,
							timestamp,
							seller,
							transactionHash,
							bondingCurve,
						};

						const transactionCollection = transactionsConnection.collection(tokenAddress);
						await transactionCollection.insertOne(transactionData);
						console.log(`Transaction saved in collection: ${tokenAddress}`);

						// Fetch token details from the database
						const tokenDetails = await primaryConnection.collection("tokens").findOne({
							mint: { $regex: new RegExp(`^${mint}$`, "i") } // Case-insensitive search using the mint field directly
						});

						if (!tokenDetails) {
							throw new Error(`❌ Token details not found for mint: ${mint}`);
						}
						const { name, symbol, imageURI, metadataURI } = tokenDetails; // Extract name, symbol, imageURI

						console.log(`📥 Updating user collection for wallet: ${seller}`);
						const userCollection = UsersConnection.collection(seller);
						// Check if user already exists in their collection
						const existingUser = await userCollection.findOne({ mint });

						if (existingUser) {
							console.log("🔄 User already exists. Updating balance...");
				
							// Update the user's balance and other details
							await userCollection.updateOne(
								{ mint },
								{
									$set: { 
										name, symbol, imageURI, metadataURI, balance : userBalance },
								}
							);
							console.log(`✅ Updated balance for ${seller}`);
						} else {
							console.log("🆕 User does not exist. Creating new record...");
				
							// Create a new record in the user's collection
							await userCollection.insertOne({
								mint,
								balance : userBalance ,
								name,
								symbol,
								imageURI,
								metadataURI,
							});
				
							console.log(`✅ New user record created for ${seller}`);
						}

					} catch (error) {
						console.error('Error during asynchronous database updates:', error.message);
						console.error(error.stack);
					}
				})();

				return response;
			} catch (error) {
				console.error('Error during token purchase:', error);
				throw new Error('Token purchase failed');
			}
		},				
	},
	Subscription: {
		tokenAdded: {
			subscribe: () => {
				return {
					[Symbol.asyncIterator]: async function* () {
						while (true) {
							yield new Promise((resolve) =>
								eventEmitter.once("TOKEN_ADDED", (data) =>
									resolve({ tokenAdded: data })
								)
							);
						}
					},
				};
			},
		},
	},
};

module.exports = resolvers;
