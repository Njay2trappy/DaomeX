const Web3 = require('web3');
const axios = require('axios');
const { gql, ApolloServer } = require('apollo-server');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path'); // For handling file paths
const mongoose = require('mongoose');
const crypto = require('crypto');

const web3 = new Web3('https://rpc.airdao.io/');
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
				"indexed": false,
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
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
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
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
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
		"name": "getMarketCap",
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
	}
];
const factoryAddress = '0x1B2E0951c9EC788a5B2305fAfD97d1d1954a7d37';
const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);

const MONGO_URI = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/?retryWrites=true&w=majority&appName=Daomex';
const MONGO_URI_TRANSACTIONS = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/transactions?retryWrites=true&w=majority&appName=Daomex';
const MONGO_URI_HOLDERS = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/holders?retryWrites=true&w=majority&appName=Daomex';
const MONGO_URI_USERS = 'mongodb+srv://UnixMachine:PAFWGjwnAzCOvZqi@daomex.2z8bx.mongodb.net/Users?retryWrites=true&w=majority&appName=Daomex';

// Primary database connection
mongoose.connect(MONGO_URI);
const primaryConnection = mongoose.connection;
primaryConnection.once('open', () => {
    console.log('Connected to the primary MongoDB database!');
});

// Transactions database connection
const transactionsConnection = mongoose.createConnection(MONGO_URI_TRANSACTIONS);
transactionsConnection.once('open', () => {
    console.log('Connected to the transactions MongoDB database!');
});

// Holders database connection
const holdersConnection = mongoose.createConnection(MONGO_URI_HOLDERS);
holdersConnection.once('open', () => {
    console.log('Connected to the holders MongoDB database!');
});

const UsersConnection = mongoose.createConnection(MONGO_URI_USERS);
UsersConnection.once('open', () => {
    console.log('Connected to the holders MongoDB database!');
});
UsersConnection.on("error", (err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

// Schema for storing API keys
const apiKeySchema = new mongoose.Schema({
	apiKey: { type: String, required: true, unique: true },
	payerAddress: { type: String, required: true },
	remainingRequests: { type: Number, default: 1000 }, // New field to track remaining requests
	createdAt: { type: Date, default: Date.now },
});
// Create the model
const ApiKey = mongoose.model('ApiKey', apiKeySchema);
const tokenSchema = new mongoose.Schema({
    mint: { type: String, unique: true, required: true },
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
    Liquidity: { type: Number, default: 0 },
    tokenPrice: { type: Number },
    virtualReserve: { type: Number },
    tokenReserve: { type: Number },
    marketCap: { type: Number },
    creationTime: { type: Date, default: Date.now },
});
const Token = mongoose.model('Token', tokenSchema);
const tradeSchema = new mongoose.Schema({
	mint: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    imageURI: { type: String },
	tokenPrice: { type: Number, required: true },
    usdPrice: { type: Number, default: 0, required: true },
	virtualReserve: { type: Number, required: true },
    Liquidity: { type: Number, default: 0 },
	tokenReserve: { type: Number, required: true },
	marketCap: { type: Number, required: true },
	usdMarketCap: { type: Number, default: 0, required: true },
    TXNS: { type: Number, default: 0, required: true },
    BUYS: { type: Number, default: 0, required: true },
    SELLS: { type: Number, default: 0, required: true },
    Volume: { type: Number, default: 0, required: true },
    BuyVolume: { type: Number, default: 0, required: true },
    SellVolume: { type: Number, default: 0, required: true },
    Age: { type: Date, default: Date.now },
});
const Trade = mongoose.model('Trade', tradeSchema);
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
const TransactionModel = transactionsConnection.model("Transaction", transactionSchema);
const holderSchema = new mongoose.Schema({
    address: { type: String, required: true }, // Wallet address of the holder
    balance: { type: Number, required: true }, // Token balance of the holder
    percentageHold: { type: Number, required: true }, // Percentage of total supply held
});
const HolderModel = mongoose.model("Holder", holderSchema);
const usersSchema = new mongoose.Schema({
    mint: { type: String, required: true }, 
    balance: { type: Number, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true }, 
    imageURI: { type: String },
    metadataURI: { type: String },
});
const UsersModel = mongoose.model("Users", usersSchema);
  

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
  

const typeDefs = gql`
	type Token {
		mint: String!
		name: String!
		symbol: String!
		totalSupply: Float!
		balanceOf: Float!
		bondingCurve: String!
		creator: String!
		transactionHash: String!
		description: String
		imageURI: String
		metadataURI: String
		twitter: String
		telegram: String
		website: String
		pool: String
		usdMarketCap: Float
		usdPrice: Float
		fdv: Float
		mint_authority: Boolean
		freeze_authority: Boolean
		liquidity_burned: Boolean
		migrated: Boolean
		burn_curve: String
		tokenPrice: Float
		virtualReserve: Float
		tokenReserve: Float
		marketCap: Float
	}

	type FActoryToken {
		address: String!
		name: String!
		symbol: String!
		metadataURI: String
		imageURI: String
		bondingCurve: String
		mint: String
		totalSupply: Float
		usdMarketCap: Float
		tokenPrice: Float
		virtualReserve: Float
		tokenReserve: Float
		marketCap: Float
		creator: String
	}
	type Transaction {
		token: String!
		tokenAddress: String!
		type: String!
		amount: Float!
		tokenPrice: Float!
		virtualReserve: Float!
		tokenReserve: Float!
		marketCap: Float!
		usdMarketCap: Float!
		usdPrice: Float!
		timestamp: String!
		buyer: String!
		transactionHash: String!
		bondingCurveAddress: String!
	}

	type TokenDetails {
		name: String!
		symbol: String!
		metadataURI: String!
		imageURI: String!
		bondingCurve: String!
		identifier: String!
	}

	type TokenPurchase {
		token: String!
		quantity: Float!
		amountPaid: Float!
		timestamp: String!
		buyer: String!
		transactionHash: String!
		bondingCurveAddress: String!
  }

	type SellTokenResponse {
		token: String!
		tokenAddress: String!
		quantitySold: Float!
		amountReceived: Float!
		timestamp: String!
		seller: String!
		transactionHash: String!
		bondingCurveAddress: String!
	}
	type ApproveTokenResponse {
		token: String!
		tokenAddress: String!
		bondingCurveAddress: String!
		amountApproved: Float!
		transactionHash: String!
		timestamp: String!
		owner: String!
	}
	type BondingCurveDetails {
		tokenPrice: Float
		virtualReserve: Float
		tokenReserve: Float
		slope: Float
		feePercent: Int
		marketCap: Float
		token: ID!
	}

	type Query {
		getFactoryAddress: String
		getBondingCurveDetails(bondingCurveAddress: ID!): BondingCurveDetails
		allowance(tokenAddress: ID!, owner: ID!, spender: ID!): Float
		getBalance(tokenAddress: ID!, userAddress: ID!): Float
		getContractDetails(MintOrAddress: String!): TokenDetails!
		requestCount(apiKey: String!): RequestCountResponse
		getMintDetails(mint: String!): Token
  		getMintValue(mint: String!): Trade
		getTransactions(MintOrAddress: String!, start: Int, limit: Int): [Transaction!]!
		getFactoryTokens: [FActoryToken!]!
    	getTokens: [FActoryToken!]!
		getHolders(mintOrAddress: String!, order: String, limit: Int): [Holder!]!
	}
	type ApiKeyResponse {
		success: Boolean!
		apiKey: String
		transactionHash: String
		remainingRequests: Int
		message: String
	}

	type RequestCountResponse {
		success: Boolean!
		remainingRequests: Int
		message: String
	}
	type FactoryResponse {
		factoryAddress: String!
		feeToSetter: String!
		transactionHash: String!
	}

	type Trade {
		mint: String!
		contractAddress: String!
		tokenPrice: Float!
		virtualReserve: Float!
		tokenReserve: Float!
		marketCap: Float!
	}
	type Holder {
		address: String!
		balance: Float!
		percentageHold: Float!
	}

	type Mutation {
		createToken(
			name: String!,
			symbol: String!,
			privateKey: String!,
			description: String,
			image: String!,
			twitter: String,
			telegram: String,
			website: String
		): Token
		buyTokens(
			MintOrAddress: String!, 
			amount: Float!, 
			slippageTolerance: Int!, 
			privateKey: String!
			apiKey: String!
		): TokenPurchase!	
		approveToken(
			MintOrAddress: String!
			amount: Float!
			privateKey: String!
  		): ApproveTokenResponse!
		sellTokens(
			MintOrAddress: String!
			amount: Float!
			slippageTolerance: Float!
			privateKey: String!
		): SellTokenResponse!
		autoSell(
			MintOrAddress: String!
			amount: Float
			slippageTolerance: Float!
			privateKey: String!
			apiKey: String!
  		): SellTokenResponse!
		createApiKey(privateKey: String!): ApiKeyResponse!
		createFactory(feeToSetter: String!, privateKey: String!): FactoryResponse
	}
`;

const resolvers = {
  Query: {
    // Fetch remaining requests for a given API key
    requestCount: async (_, { apiKey }) => {
		try {
		  const apiKeyRecord = await ApiKey.findOne({ apiKey });
  
		  if (!apiKeyRecord) {
			throw new Error('Invalid API key');
		  }
  
		  return {
			success: true,
			remainingRequests: apiKeyRecord.remainingRequests,
			message: `You have ${apiKeyRecord.remainingRequests} requests remaining.`,
		  };
		} catch (error) {
		  console.error('Error fetching request count:', error);
		  throw new Error('Failed to fetch request count');
		}
	},
	getMintDetails: async (_, { mint }) => {
		try {
		  const token = await Token.findOne({ mint });
		  if (!token) {
			throw new Error(`Token with mint ${mint} not found.`);
		  }
		  return token;
		} catch (error) {
		  console.error('Error fetching token details:', error);
		  throw new Error('Failed to fetch token details.');
		}
	},
	getMintValue: async (_, { mint }) => {
		try {
		  const trade = await Trade.findOne({ mint });
		  if (!trade) {
			throw new Error(`Trade details for mint ${mint} not found.`);
		  }
		  return trade;
		} catch (error) {
		  console.error('Error fetching trade details:', error);
		  throw new Error('Failed to fetch trade details.');
		}
	},
    getFactoryAddress: () => factoryAddress,
    getBondingCurveDetails: async (_, { bondingCurveAddress }) => {
      const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);

      const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
      const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
      const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();
      const slope = await bondingCurveContract.methods.slope().call();
      const feePercent = await bondingCurveContract.methods.feePercent().call();
      const marketCap = await bondingCurveContract.methods.getMarketCap().call();
      const token = await bondingCurveContract.methods.token().call();

      return {
        tokenPrice: parseFloat(web3.utils.fromWei(tokenPrice, 'ether')),
        virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
        tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
        slope: parseFloat(web3.utils.fromWei(slope, 'ether')),
        feePercent: parseInt(feePercent),
        marketCap: parseFloat(web3.utils.fromWei(marketCap, 'ether')),
        token
      };
    },
    allowance: async (_, { tokenAddress, owner, spender }) => {
      try {
        const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
        const allowance = await tokenContract.methods.allowance(owner, spender).call();
        console.log(`Allowance: ${web3.utils.fromWei(allowance, 'ether')} tokens`);
        return parseFloat(web3.utils.fromWei(allowance, 'ether'));
      } catch (error) {
        console.error('Error fetching allowance:', error);
        throw new Error('Failed to fetch allowance');
      }
    },
    getBalance: async (_, { tokenAddress, userAddress }) => {
      try {
        const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
        const balance = await tokenContract.methods.balanceOf(userAddress).call();
        console.log(`Balance: ${web3.utils.fromWei(balance, 'ether')} tokens`);
        return parseFloat(web3.utils.fromWei(balance, 'ether'));
      } catch (error) {
        console.error('Error fetching balance:', error);
        throw new Error('Failed to fetch balance');
      }
    },
	getContractDetails: async (_, { MintOrAddress }) => {
		try {
		  let tokenAddress;
  
		  // Check if the input is an identifier (ends with DAOME)
		  if (MintOrAddress.endsWith('DAOME')) {
			tokenAddress = MintOrAddress.replace('DAOME', '');
		  } else {
			tokenAddress = MintOrAddress;
		  }
  
		  console.log(`Fetching details for token address: ${tokenAddress}`);
  
		  // Fetch token details from the factory
		  const tokenDetails = await factoryContract.methods.getTokenDetails(tokenAddress).call();
  
		  return {
			name: tokenDetails[0],
			symbol: tokenDetails[1],
			metadataURI: tokenDetails[2],
			imageURI: tokenDetails[3],
			bondingCurve: tokenDetails[4],
			identifier: tokenDetails[5],
		  };
		} catch (error) {
		  console.error('Error fetching contract details:', error);
		  throw new Error('Failed to fetch contract details');
		}
	},
	getTransactions: async (_, { MintOrAddress, start = 0, limit }) => {
		try {
			let contractAddress;

			// Check if the input is a mint or contract address
			if (MintOrAddress.endsWith('DAOME')) {
				// If it's a mint, remove "DAOME" to extract the address
				contractAddress = MintOrAddress.replace('DAOME', '');
				console.log(`Mint provided, derived contract address: ${contractAddress}`);
			} else {
				// If it's a contract address, use it directly
				contractAddress = MintOrAddress;
				console.log(`Contract address provided: ${contractAddress}`);
			}

			// Ensure the contract address is valid
			if (!web3.utils.isAddress(contractAddress)) {
				throw new Error('Invalid contract address');
			}

			// Query the transactions database for the specified contract address
			const transactionCollection = transactionsConnection.collection(contractAddress);

			let transactionsQuery = transactionCollection.find({});

			// Apply range filters if provided
			if (start >= 0) {
				transactionsQuery = transactionsQuery.skip(start);
			}
			if (limit > 0) {
				transactionsQuery = transactionsQuery.limit(limit);
			}

			const transactions = await transactionsQuery.toArray();

			console.log(
				`Fetched ${transactions.length} transactions for contract address: ${contractAddress}, starting from ${start} with limit ${limit}`
			);

			return transactions.map(tx => ({
				type: tx.type,
				quantity: tx.quantity || tx.quantitySold,
				amount: tx.amountPaid || tx.amountReceived,
				timestamp: tx.timestamp,
				user: tx.buyer || tx.seller, // Adjust based on transaction type
				transactionHash: tx.transactionHash,
			}));
		} catch (error) {
			console.error('Error fetching transactions:', error);
			throw new Error('Failed to fetch transactions');
		}
	},
	getFactoryTokens: async () => {
		try {
			console.log('Fetching tokens directly from factory using events...');
	
			// Query the blockchain for all `TokenCreated` events
			const events = await factoryContract.getPastEvents('TokenCreated', {
				fromBlock: 0, // Start from the genesis block
				toBlock: 'latest', // Up to the latest block
			});
	
			if (!events || events.length === 0) {
				console.log('No tokens found in the factory.');
				return [];
			}
	
			// Extract token addresses and details from events
			const tokens = events.map((event) => {
				const { token, bondingCurve, metadataURI, imageURI, identifier } = event.returnValues;
	
				if (!token) {
					console.error('Missing token address in event:', event);
					return null; // Skip invalid events
				}
	
				return {
					address: token || null,
					bondingCurve: bondingCurve || null,
					metadataURI: metadataURI || null,
					imageURI: imageURI || null,
					mint: identifier || null,
				};
			}).filter((token) => token !== null); // Remove invalid tokens
	
			console.log(`Fetched ${tokens.length} tokens from factory.`);
			return tokens;
		} catch (error) {
			console.error('Error fetching tokens from factory:', error);
			throw new Error('Failed to fetch tokens from factory.');
		}
	},	
	getTokens: async () => {
		try {
			console.log('Fetching tokens from the MongoDB tokens collection...');
			
			const tokens = await primaryConnection.collection('tokens').find({}).toArray();

			console.log('Fetched tokens from MongoDB:', tokens);
			return tokens.map(token => ({
				address: token.address,
				name: token.name,
				symbol: token.symbol,
				totalSupply: token.totalSupply,
				usdMarketCap: token.usdMarketCap,
				tokenPrice: token.tokenPrice,
				virtualReserve: token.virtualReserve,
				tokenReserve: token.tokenReserve,
				marketCap: token.marketCap,
				creator: token.creator,
				metadataURI: token.metadataURI,
				imageURI: token.imageURI,
			}));
		} catch (error) {
			console.error('Error fetching tokens from MongoDB:', error);
			throw new Error('Failed to fetch tokens from the MongoDB database.');
		}
	},
	getHolders: async (_, { mintOrAddress, order = "asc", limit = 100 }) => {
		try {
			let contractAddress;

			// Parse mintOrAddress to determine the contract address
			if (mintOrAddress.endsWith('DAOME')) {
				contractAddress = mintOrAddress.replace('DAOME', '');
				console.log(`Mint provided, parsed contract address: ${contractAddress}`);
			} else {
				contractAddress = mintOrAddress;
				console.log(`Contract address provided: ${contractAddress}`);
			}

			// Ensure limit is a valid positive number
			if (isNaN(limit) || limit <= 0) {
				throw new Error('Invalid limit value. Please provide a positive number.');
			}

			// Connect to the holders database and query the collection
			const holdersCollection = holdersConnection.collection(contractAddress);

			// Determine sort order: 1 for ascending, -1 for descending
			const sortOrder = order.toLowerCase() === 'desc' ? -1 : 1;

			console.log(`Fetching holders for contract address: ${contractAddress}`);
			console.log(`Order: ${order}, Limit: ${limit}`);

			const holders = await holdersCollection
				.find({})
				.sort({ percentageHold: sortOrder }) // Sort by percentageHold
				.limit(parseInt(limit, 10)) // Apply limit
				.toArray();

			console.log(`Fetched holders:`, holders);

			// Map the holders to return relevant fields
			return holders.map(holder => ({
				address: holder.address,
				balance: holder.balance,
				percentageHold: holder.percentageHold,
			}));
		} catch (error) {
			console.error('Error fetching holders:', error);
			throw new Error('Failed to fetch holders.');
		}
	},
  },
  	Mutation: {
		createToken: async (_, { name, symbol, privateKey, description, twitter, telegram, website }) => {
			const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(account);
		
			try {
				console.log(`Creating token: ${name}, Symbol: ${symbol}`);
		
				// Step 1: Verify user balance
				const userBalance = await web3.eth.getBalance(account.address);
				const requiredBalance = web3.utils.toWei('100', 'ether');
		
				if (web3.utils.toBN(userBalance).lt(web3.utils.toBN(requiredBalance))) {
					throw new Error('Insufficient balance to create token');
				}
		
				// Step 2: Upload image to IPFS
				const imagePath = path.join(__dirname, 'daome.png');
				if (!fs.existsSync(imagePath)) {
					throw new Error('Image file not found: car.png');
				}
		
				const formData = new FormData();
				formData.append('file', fs.createReadStream(imagePath));
		
				const imageResponse = await axios.post(
					'https://api.pinata.cloud/pinning/pinFileToIPFS',
					formData,
					{
						headers: {
							...formData.getHeaders(),
							pinata_api_key: '1449febbb19f35611046',
							pinata_secret_api_key: '32d1e1e4f72b623b879cb1f0c02ac3d6846648586abe4fe22f0fc58f72d09d67',
						},
					}
				);
		
				const imageURI = `https://gateway.pinata.cloud/ipfs/${imageResponse.data.IpfsHash}`;
				console.log(`Image uploaded to IPFS: ${imageURI}`);
		
				// Step 3: Create metadata and upload to IPFS
				const totalSupply = 1_000_000_000;
				const creator = account.address;
		
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
						{ trait_type: "Creator", value: creator },
						{ trait_type: "Network", value: "AirDAO" },
						{ trait_type: "Total Supply", value: totalSupply },
					],
				};
		
				const metadataResponse = await axios.post(
					'https://api.pinata.cloud/pinning/pinJSONToIPFS',
					tokenMetadata,
					{
						headers: {
							pinata_api_key: '1449febbb19f35611046',
							pinata_secret_api_key: '32d1e1e4f72b623b879cb1f0c02ac3d6846648586abe4fe22f0fc58f72d09d67',
						},
					}
				);
		
				const metadataURI = `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`;
				console.log(`Metadata uploaded to IPFS: ${metadataURI}`);
		
				// Fetch AMB Price
				const ambPrice = await fetchAmbPrice();
				if (ambPrice === 0) {
					console.warn('AMB price not available. Proceeding with USD Market Cap as 0.');
				}
		
				// Step 4: Create token on blockchain
				const tx = factoryContract.methods.createToken(name, symbol, metadataURI, imageURI);
				const gas = await tx.estimateGas({ from: account.address, value: requiredBalance });
		
				const receipt = await tx.send({
					from: account.address,
					gas,
					value: requiredBalance,
				});
		
				console.log('Transaction receipt:', receipt);
		
				const tokenAddress = receipt.events.TokenCreated.returnValues.token;
				const bondingCurveAddress = receipt.events.TokenCreated.returnValues.bondingCurve;
				const mint = receipt.events.TokenCreated.returnValues.identifier;
				const transactionHash = receipt.transactionHash;
		
				// Initialize bondingCurveContract
				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
		
				// Fetch bonding curve details
				const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
				const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
				const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();
				const marketCap = await bondingCurveContract.methods.getMarketCap().call();
		
				const numericMarketCap = parseFloat(web3.utils.fromWei(marketCap, 'ether'));
				const numericvirtualReserve = parseFloat(web3.utils.fromWei(virtualReserve, 'ether'));
				const numericUsdprice = parseFloat(web3.utils.fromWei(tokenPrice, 'ether'));
				const usdMarketCap = isNaN(numericMarketCap) || isNaN(ambPrice) ? 0 : numericMarketCap * ambPrice;
				const usdPrice = isNaN(numericUsdprice) || isNaN(ambPrice) ? 0 : numericUsdprice * ambPrice;
				const Liquidity = isNaN(numericvirtualReserve) || isNaN(ambPrice) ? 0 : numericvirtualReserve * ambPrice;

				// Get the current timestamp
				const creationTime = new Date();

				// Save to MongoDB
				const tokenData = {
					mint,
					name,
					symbol,
					totalSupply,
					balanceOf: totalSupply,
					bondingCurve: bondingCurveAddress,
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
					Liquidity,
					tokenPrice: parseFloat(web3.utils.fromWei(tokenPrice, 'ether')),
					virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
					tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
					marketCap: parseFloat(web3.utils.fromWei(marketCap, 'ether')),
					creationTime,
				};
		
				const tradeData = {
					mint,
					name,
					symbol,
					imageURI,
					tokenPrice: parseFloat(web3.utils.fromWei(tokenPrice, 'ether')),
					usdPrice,
					virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
					Liquidity,
					tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
					marketCap: parseFloat(web3.utils.fromWei(marketCap, 'ether')),
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
		
				console.log('Token and trade details saved in MongoDB');

				// Create a collection for holders in the holders database
                await holdersConnection.createCollection(tokenAddress);
                console.log(`Holders collection created for token: ${tokenAddress}`);
		
				// Return response
				return {
					mint,
					name,
					symbol,
					totalSupply,
					balanceOf: totalSupply,
					bondingCurve: bondingCurveAddress,
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
					marketCap: parseFloat(web3.utils.fromWei(marketCap, 'ether')),
				};
			} catch (error) {
				console.error('Error during token creation:', error);
				throw new Error('Token creation failed');
			}
		},				  
		buyTokens: async (_, { MintOrAddress, amount, slippageTolerance, privateKey, apiKey }) => {
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
		sellTokens: async (_, { MintOrAddress, amount, slippageTolerance, privateKey }) => {
			const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(account);
		
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
			const bondingCurveAddress = tokenDetails[4]; // Assuming bondingCurve is at index 4
			const tokenName = tokenDetails[0]; // Assuming token name is at index 0
		
			console.log(`Bonding curve address fetched: ${bondingCurveAddress}`);
			console.log(`Token name fetched: ${tokenName}`);
		
			const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
		
			console.log(`Selling tokens to bonding curve: ${bondingCurveAddress}`);
			console.log(`Amount to sell (before adjustment): ${amount}, Slippage Tolerance: ${slippageTolerance}`);
		
			// Subtract 1 wei from the user's input amount
			const adjustedAmount = web3.utils.toBN(web3.utils.toWei(amount.toString(), 'ether')).sub(web3.utils.toBN(1));
			console.log(`Adjusted amount to sell (in wei): ${adjustedAmount.toString()}`);
		
			// Fetch token address from bonding curve contract
			const tokenAddress = await bondingCurveContract.methods.token().call();
			const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
		
			// Validate user balance
			const userBalance = await tokenContract.methods.balanceOf(account.address).call();
			console.log(`User balance: ${web3.utils.fromWei(userBalance, 'ether')} tokens`);
		
			if (web3.utils.toBN(userBalance).lt(adjustedAmount)) {
				throw new Error('Insufficient token balance to sell');
			}
		
			// Validate allowance
			const allowance = await tokenContract.methods.allowance(account.address, bondingCurveAddress).call();
			console.log(`Allowance: ${web3.utils.fromWei(allowance, 'ether')} tokens`);
		
			if (web3.utils.toBN(allowance).lt(adjustedAmount)) {
				console.log('Approving bonding curve to spend tokens...');
				const approveTx = tokenContract.methods.approve(bondingCurveAddress, adjustedAmount.toString());
				const approveGas = await approveTx.estimateGas({ from: account.address });
				await approveTx.send({ from: account.address, gas: approveGas });
				console.log('Approval successful');
			}
		
			// Execute sellTokens
			const tx = bondingCurveContract.methods.sellTokens(adjustedAmount.toString(), slippageTolerance);
			const gas = await tx.estimateGas({ from: account.address });
			const receipt = await tx.send({ from: account.address, gas });
		
			console.log('Transaction receipt:', receipt);
		
			const timestamp = new Date().toISOString();
			const seller = account.address;
			const transactionHash = receipt.transactionHash;
		
			// Fetching sale details from receipt
			const event = receipt.events.TokensBurned;
			const quantitySold = parseFloat(web3.utils.fromWei(event.returnValues.amount, 'ether'));
			const amountReceived = parseFloat(web3.utils.fromWei(event.returnValues.netRefund, 'ether'));
		
			return {
				token: tokenName,
				tokenAddress,
				quantitySold,
				amountReceived,
				timestamp,
				seller,
				transactionHash,
				bondingCurveAddress,
			};
			} catch (error) {
			console.error('Error during token sale:', error);
			throw new Error('Token sale failed');
			}
		},	
		approveToken: async (_, { MintOrAddress, amount, privateKey }) => {
			try {
			// 1. Derive the true contract address by removing 'DAOME' if present
			let contractAddress;
			if (MintOrAddress.endsWith('DAOME')) {
				contractAddress = MintOrAddress.replace('DAOME', '');
				console.log(`Identifier provided, stripped 'DAOME' -> Contract Address: ${contractAddress}`);
			} else {
				contractAddress = MintOrAddress;
				console.log(`Raw Contract Address provided: ${contractAddress}`);
			}
	
			// 2. Create the user account from the private key
			const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(account);
	
			console.log(`Amount to approve: ${amount}`);
	
			// 3. Fetch token details from the factory
			const factoryContract = new web3.eth.Contract(factoryABI, FACTORY_CONTRACT_ADDRESS);
			const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
			// For example: tokenDetails = [ tokenName, ..., ..., ..., bondingCurveAddress ]
			const tokenName = tokenDetails[0];
			const bondingCurveAddress = tokenDetails[4];
	
			console.log(`Token name: ${tokenName}`);
			console.log(`Bonding curve address: ${bondingCurveAddress}`);
	
			// 4. Use the bonding curve to find the actual token address
			const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
			const tokenAddress = await bondingCurveContract.methods.token().call();
			console.log(`Token address found: ${tokenAddress}`);
	
			// 5. Approve the bonding curve to spend the user's tokens
			const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
			const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
			console.log(`Approval amount in wei: ${amountInWei}`);
	
			const approveTx = tokenContract.methods.approve(bondingCurveAddress, amountInWei);
	
			// 6. Estimate gas and send the transaction
			const gas = await approveTx.estimateGas({ from: account.address });
			console.log(`Estimated gas: ${gas}`);
	
			const receipt = await approveTx.send({ from: account.address, gas });
			console.log('Approval transaction successful:', receipt);
	
			// 7. Construct and return the response
			const transactionHash = receipt.transactionHash;
			const timestamp = new Date().toISOString();
			const owner = account.address;
	
			return {
				token: tokenName,
				tokenAddress,
				bondingCurveAddress,
				amountApproved: parseFloat(amount),
				transactionHash,
				timestamp,
				owner,
			};
			} catch (error) {
			console.error('Error during token approval:', error);
			throw new Error('Token approval failed');
			}
		},  
		autoSell: async (_, { MintOrAddress, amount, slippageTolerance, privateKey, apiKey }) => {
			try {
				// Validate the API key
				await validateApiKey(apiKey);
		
				// Parse input: Strip 'DAOME' if present
				let contractAddress;
				if (MintOrAddress.endsWith('DAOME')) {
					contractAddress = MintOrAddress.replace('DAOME', '');
					console.log(`Identifier detected, stripped "DAOME": ${contractAddress}`);
				} else {
					contractAddress = MintOrAddress;
					console.log(`Raw contract address provided: ${contractAddress}`);
				}
		
				// Create account from private key
				const account = web3.eth.accounts.privateKeyToAccount(privateKey);
				web3.eth.accounts.wallet.add(account);
		
				// Fetch token details from the factory
				const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
				const tokenName = tokenDetails[0];
				const bondingCurveAddress = tokenDetails[4];
		
				console.log(`Token name: ${tokenName}`);
				console.log(`Bonding curve address: ${bondingCurveAddress}`);
		
				// Create contract instances
				const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
				const tokenContract = new web3.eth.Contract(ERC20ABI, contractAddress);
		
				// Fetch and validate user balance
				const userBalance = await tokenContract.methods.balanceOf(account.address).call();
				console.log(`User balance: ${web3.utils.fromWei(userBalance, 'ether')} tokens`);
		
				if (web3.utils.toBN(userBalance).lte(web3.utils.toBN(0))) {
					throw new Error('Insufficient token balance to sell');
				}
		
				// Use the user's full balance minus 1 wei for the sale
				const adjustedAmount = web3.utils.toBN(userBalance).sub(web3.utils.toBN(1));
				console.log(`Adjusted amount to sell (in wei): ${adjustedAmount.toString()}`);
		
				// Approve the bonding curve to spend user's full token balance
				console.log('Approving bonding curve to spend full token balance...');
				const approveTx = tokenContract.methods.approve(bondingCurveAddress, userBalance);
				const approveGas = await approveTx.estimateGas({ from: account.address });
				await approveTx.send({ from: account.address, gas: approveGas });
				console.log('Approval successful');
		
				// Execute the sellTokens transaction
				console.log('Executing sellTokens...');
				const sellTx = bondingCurveContract.methods.sellTokens(
					adjustedAmount.toString(),
					slippageTolerance
				);
				const sellGas = await sellTx.estimateGas({ from: account.address });
				const receipt = await sellTx.send({ from: account.address, gas: sellGas });
		
				console.log('Transaction receipt:', receipt);
		
				// Extract relevant info from the receipt
				const timestamp = new Date().toISOString();
				const seller = account.address;
				const transactionHash = receipt.transactionHash;
		
				const tokensBurnedEvent = receipt.events.TokensBurned;
				const quantitySold = parseFloat(web3.utils.fromWei(tokensBurnedEvent.returnValues.amount, 'ether'));
				const amountReceived = parseFloat(web3.utils.fromWei(tokensBurnedEvent.returnValues.netRefund, 'ether'));
				const mint = tokenAddress + 'DAOME';
		
				// Fetch updated bonding curve details
				const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
				const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
				const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();
				const marketCap = await bondingCurveContract.methods.getMarketCap().call();
				const tokenAddress = (await bondingCurveContract.methods.token().call()).toLowerCase();
		
				const ambPrice = await fetchAmbPrice();
				const numericTokenPrice = parseFloat(web3.utils.fromWei(tokenPrice, 'ether'));
				const numericvirtualReserve = parseFloat(web3.utils.fromWei(virtualReserve, 'ether'));
				const numericMarketCap = parseFloat(web3.utils.fromWei(marketCap, 'ether'));
				const usdMarketCap = numericMarketCap * ambPrice || 0;
				const usdPrice = numericTokenPrice * ambPrice || 0;
				const Liquidity = isNaN(numericvirtualReserve) || isNaN(ambPrice) ? 0 : numericvirtualReserve * ambPrice;
				const volumesell = amountReceived * ambPrice
		
				// Return response immediately
				const response = {
					token: tokenName,
					mint,
					type: "Sell",
					quantitySold,
					amountReceived,
					tokenPrice: numericTokenPrice,
					virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
					tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
					marketCap: numericMarketCap,
					usdMarketCap,
					usdPrice,
					timestamp,
					seller,
					transactionHash,
					bondingCurveAddress,
				};
				console.log('Response sent to client:', response);
		
				// Perform database updates asynchronously
				(async () => {
					try {
						// Update token and trades in primary database
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
							type: "Sell",
							quantity,
							amountPaid: parseFloat(amount),
							tokenPrice: numericTokenPrice,
							virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve || '0', 'ether')),
							tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve || '0', 'ether')),
							marketCap: numericMarketCap,
							usdMarketCap,
							usdPrice,
							timestamp,
							seller,
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
				console.error('Error during auto-sell:', error);
				throw new Error('Auto-sell failed');
			}
		},				
		createApiKey: async (_, { privateKey }) => {
			try {
			  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			  web3.eth.accounts.wallet.add(account);
	  
			  const payerAddress = account.address;
			  const apiFeeAddress = '0xFB9d8C2218e310a40276d1C6f6D0cF3f725fc0d7';
			  const apiFeeAmount = web3.utils.toWei('1000', 'ether'); // 100 AMB
	  
			  console.log(`Payer Address: ${payerAddress}`);
			  console.log(`API Fee Address: ${apiFeeAddress}`);
			  console.log(`API Fee Amount: ${apiFeeAmount} wei`);
	  
			  // Sign and send the transaction
			  const tx = {
				from: payerAddress,
				to: apiFeeAddress,
				value: apiFeeAmount,
				gas: 21000, // Adjust gas limit if necessary
			  };
	  
			  const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
			  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
	  
			  console.log('Transaction receipt:', receipt);
	  
			  if (receipt.status) {
				// Generate and store API key if transaction is successful
				const apiKey = await generateApiKey(payerAddress);
	  
				return {
				  success: true,
				  apiKey,
				  payerAddress,
				  remainingRequests: 1000,
				  message: 'API key created successfully after payment',
				  transactionHash: receipt.transactionHash,
				};
			  } else {
				throw new Error('Transaction failed');
			  }
			} catch (error) {
			  console.error('Error during API key creation:', error);
			  throw new Error('Failed to create API key');
			}
		},
		createFactory: async (_, { feeToSetter, privateKey }) => {
			try {
			  console.log(`Creating a new factory with feeToSetter: ${feeToSetter}`);
		  
			  // 1. Create account from private key
			  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			  web3.eth.accounts.wallet.add(account);
		  
			  // 2. Deploy the Factory Contract
			  const factoryBytecode = '0x60806040527365c4088f90d40fa1d1f7e286e45abc66dcea01ff6000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555068056bc75e2d6310000060025534801561007157600080fd5b50604051614b00380380614b00833981810160405281019061009391906101ac565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610102576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100f99061025c565b60405180910390fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505061027c565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101798261014e565b9050919050565b6101898161016e565b811461019457600080fd5b50565b6000815190506101a681610180565b92915050565b6000602082840312156101c2576101c1610149565b5b60006101d084828501610197565b91505092915050565b600082825260208201905092915050565b7f466565546f5365747465722063616e6e6f74206265207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b60006102466022836101d9565b9150610251826101ea565b604082019050919050565b6000602082019050818103600083015261027581610239565b9050919050565b6148758061028b6000396000f3fe6080604052600436106100705760003560e01c806388aa8bee1161004e57806388aa8bee14610108578063a07696591461014a578063dce0b4e41461017c578063dd4be683146101a757610070565b8063017e7e5814610075578063094b7415146100a0578063634282af146100cb575b600080fd5b34801561008157600080fd5b5061008a6101e7565b6040516100979190610ef9565b60405180910390f35b3480156100ac57600080fd5b506100b561020b565b6040516100c29190610ef9565b60405180910390f35b3480156100d757600080fd5b506100f260048036038101906100ed9190610f5e565b610231565b6040516100ff9190610ef9565b60405180910390f35b34801561011457600080fd5b5061012f600480360381019061012a9190610fb7565b610270565b60405161014196959493929190611074565b60405180910390f35b610164600480360381019061015f919061122d565b6105ec565b60405161017393929190611304565b60405180910390f35b34801561018857600080fd5b506101916109d9565b60405161019e9190611351565b60405180910390f35b3480156101b357600080fd5b506101ce60048036038101906101c99190610fb7565b6109df565b6040516101de949392919061136c565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6004818154811061024157600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b606080606080600060606000600360008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206040518060800160405290816000820180546102d6906113f5565b80601f0160208091040260200160405190810160405280929190818152602001828054610302906113f5565b801561034f5780601f106103245761010080835404028352916020019161034f565b820191906000526020600020905b81548152906001019060200180831161033257829003601f168201915b50505050508152602001600182018054610368906113f5565b80601f0160208091040260200160405190810160405280929190818152602001828054610394906113f5565b80156103e15780601f106103b6576101008083540402835291602001916103e1565b820191906000526020600020905b8154815290600101906020018083116103c457829003601f168201915b505050505081526020016002820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600382018054610450906113f5565b80601f016020809104026020016040519081016040528092919081815260200182805461047c906113f5565b80156104c95780601f1061049e576101008083540402835291602001916104c9565b820191906000526020600020905b8154815290600101906020018083116104ac57829003601f168201915b505050505081525050905060008890508073ffffffffffffffffffffffffffffffffffffffff166306fdde036040518163ffffffff1660e01b8152600401600060405180830381865afa158015610524573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f8201168201806040525081019061054d9190611496565b8173ffffffffffffffffffffffffffffffffffffffff166395d89b416040518163ffffffff1660e01b8152600401600060405180830381865afa158015610598573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f820116820180604052508101906105c19190611496565b8360000151846020015185604001518660600151975097509750975097509750505091939550919395565b6000806060600254341015610636576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161062d90611551565b60405180910390fd5b600060405161064490610e9e565b604051809103906000f080158015610660573d6000803e3d6000fd5b509050600088888360405161067490610eab565b61068093929190611571565b604051809103906000f08015801561069c573d6000803e3d6000fd5b5090508094508173ffffffffffffffffffffffffffffffffffffffff1663c4d66de8866040518263ffffffff1660e01b81526004016106db9190610ef9565b600060405180830381600087803b1580156106f557600080fd5b505af1158015610709573d6000803e3d6000fd5b50505050819350600061071b86610bc7565b60405160200161072b919061163e565b604051602081830303815290604052905060405180608001604052808981526020018881526020018673ffffffffffffffffffffffffffffffffffffffff16815260200182815250600360008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008201518160000190816107c7919061180c565b5060208201518160010190816107dd919061180c565b5060408201518160020160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550606082015181600301908161083a919061180c565b509050506004869080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508573ffffffffffffffffffffffffffffffffffffffff167ffe210c99153843bc67efa2e9a61ec1d63c505e379b9dcf05a9520e84e36e6063868a8a856040516108ed94939291906118de565b60405180910390a260008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163460405161093c90611969565b60006040518083038185875af1925050503d8060008114610979576040519150601f19603f3d011682016040523d82523d6000602084013e61097e565b606091505b50509050806109c2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109b9906119ca565b60405180910390fd5b868683965096509650505050509450945094915050565b60025481565b6003602052806000526040600020600091509050806000018054610a02906113f5565b80601f0160208091040260200160405190810160405280929190818152602001828054610a2e906113f5565b8015610a7b5780601f10610a5057610100808354040283529160200191610a7b565b820191906000526020600020905b815481529060010190602001808311610a5e57829003601f168201915b505050505090806001018054610a90906113f5565b80601f0160208091040260200160405190810160405280929190818152602001828054610abc906113f5565b8015610b095780601f10610ade57610100808354040283529160200191610b09565b820191906000526020600020905b815481529060010190602001808311610aec57829003601f168201915b5050505050908060020160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690806003018054610b44906113f5565b80601f0160208091040260200160405190810160405280929190818152602001828054610b70906113f5565b8015610bbd5780601f10610b9257610100808354040283529160200191610bbd565b820191906000526020600020905b815481529060010190602001808311610ba057829003601f168201915b5050505050905084565b60606000602a67ffffffffffffffff811115610be657610be5611102565b5b6040519080825280601f01601f191660200182016040528015610c185781602001600182028036833780820191505090505b5090507f300000000000000000000000000000000000000000000000000000000000000081600081518110610c5057610c4f6119ea565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053507f780000000000000000000000000000000000000000000000000000000000000081600181518110610cb457610cb36119ea565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a90535060005b6014811015610e4e576000816013610cfe9190611a48565b6008610d0a9190611a7c565b6002610d169190611bf1565b8573ffffffffffffffffffffffffffffffffffffffff16610d379190611c6b565b60f81b9050600060108260f81c610d4e9190611ca9565b60f81b905060008160f81c6010610d659190611cda565b8360f81c610d739190611d17565b60f81b9050610d8182610e58565b856002866002610d919190611a7c565b610d9b9190611d4c565b81518110610dac57610dab6119ea565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350610de481610e58565b856003866002610df49190611a7c565b610dfe9190611d4c565b81518110610e0f57610e0e6119ea565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053505050508080600101915050610ce6565b5080915050919050565b6000600a8260f81c60ff161015610e835760308260f81c610e799190611d80565b60f81b9050610e99565b60578260f81c610e939190611d80565b60f81b90505b919050565b61176880611db683390190565b6113228061351e83390190565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610ee382610eb8565b9050919050565b610ef381610ed8565b82525050565b6000602082019050610f0e6000830184610eea565b92915050565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b610f3b81610f28565b8114610f4657600080fd5b50565b600081359050610f5881610f32565b92915050565b600060208284031215610f7457610f73610f1e565b5b6000610f8284828501610f49565b91505092915050565b610f9481610ed8565b8114610f9f57600080fd5b50565b600081359050610fb181610f8b565b92915050565b600060208284031215610fcd57610fcc610f1e565b5b6000610fdb84828501610fa2565b91505092915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561101e578082015181840152602081019050611003565b60008484015250505050565b6000601f19601f8301169050919050565b600061104682610fe4565b6110508185610fef565b9350611060818560208601611000565b6110698161102a565b840191505092915050565b600060c082019050818103600083015261108e818961103b565b905081810360208301526110a2818861103b565b905081810360408301526110b6818761103b565b905081810360608301526110ca818661103b565b90506110d96080830185610eea565b81810360a08301526110eb818461103b565b9050979650505050505050565b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61113a8261102a565b810181811067ffffffffffffffff8211171561115957611158611102565b5b80604052505050565b600061116c610f14565b90506111788282611131565b919050565b600067ffffffffffffffff82111561119857611197611102565b5b6111a18261102a565b9050602081019050919050565b82818337600083830152505050565b60006111d06111cb8461117d565b611162565b9050828152602081018484840111156111ec576111eb6110fd565b5b6111f78482856111ae565b509392505050565b600082601f830112611214576112136110f8565b5b81356112248482602086016111bd565b91505092915050565b6000806000806080858703121561124757611246610f1e565b5b600085013567ffffffffffffffff81111561126557611264610f23565b5b611271878288016111ff565b945050602085013567ffffffffffffffff81111561129257611291610f23565b5b61129e878288016111ff565b935050604085013567ffffffffffffffff8111156112bf576112be610f23565b5b6112cb878288016111ff565b925050606085013567ffffffffffffffff8111156112ec576112eb610f23565b5b6112f8878288016111ff565b91505092959194509250565b60006060820190506113196000830186610eea565b6113266020830185610eea565b8181036040830152611338818461103b565b9050949350505050565b61134b81610f28565b82525050565b60006020820190506113666000830184611342565b92915050565b60006080820190508181036000830152611386818761103b565b9050818103602083015261139a818661103b565b90506113a96040830185610eea565b81810360608301526113bb818461103b565b905095945050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061140d57607f821691505b6020821081036114205761141f6113c6565b5b50919050565b60006114396114348461117d565b611162565b905082815260208101848484011115611455576114546110fd565b5b611460848285611000565b509392505050565b600082601f83011261147d5761147c6110f8565b5b815161148d848260208601611426565b91505092915050565b6000602082840312156114ac576114ab610f1e565b5b600082015167ffffffffffffffff8111156114ca576114c9610f23565b5b6114d684828501611468565b91505092915050565b7f466163746f72793a20496e73756666696369656e74206372656174696f6e206660008201527f6565000000000000000000000000000000000000000000000000000000000000602082015250565b600061153b602283610fef565b9150611546826114df565b604082019050919050565b6000602082019050818103600083015261156a8161152e565b9050919050565b6000606082019050818103600083015261158b818661103b565b9050818103602083015261159f818561103b565b90506115ae6040830184610eea565b949350505050565b600081905092915050565b60006115cc82610fe4565b6115d681856115b6565b93506115e6818560208601611000565b80840191505092915050565b7f44414f4d45000000000000000000000000000000000000000000000000000000600082015250565b60006116286005836115b6565b9150611633826115f2565b600582019050919050565b600061164a82846115c1565b91506116558261161b565b915081905092915050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026116c27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82611685565b6116cc8683611685565b95508019841693508086168417925050509392505050565b6000819050919050565b60006117096117046116ff84610f28565b6116e4565b610f28565b9050919050565b6000819050919050565b611723836116ee565b61173761172f82611710565b848454611692565b825550505050565b600090565b61174c61173f565b61175781848461171a565b505050565b5b8181101561177b57611770600082611744565b60018101905061175d565b5050565b601f8211156117c05761179181611660565b61179a84611675565b810160208510156117a9578190505b6117bd6117b585611675565b83018261175c565b50505b505050565b600082821c905092915050565b60006117e3600019846008026117c5565b1980831691505092915050565b60006117fc83836117d2565b9150826002028217905092915050565b61181582610fe4565b67ffffffffffffffff81111561182e5761182d611102565b5b61183882546113f5565b61184382828561177f565b600060209050601f8311600181146118765760008415611864578287015190505b61186e85826117f0565b8655506118d6565b601f19841661188486611660565b60005b828110156118ac57848901518255600182019150602085019450602081019050611887565b868310156118c957848901516118c5601f8916826117d2565b8355505b6001600288020188555050505b505050505050565b60006080820190506118f36000830187610eea565b8181036020830152611905818661103b565b90508181036040830152611919818561103b565b9050818103606083015261192d818461103b565b905095945050505050565b600081905092915050565b50565b6000611953600083611938565b915061195e82611943565b600082019050919050565b600061197482611946565b9150819050919050565b7f466565207472616e73666572206661696c656400000000000000000000000000600082015250565b60006119b4601383610fef565b91506119bf8261197e565b602082019050919050565b600060208201905081810360008301526119e3816119a7565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000611a5382610f28565b9150611a5e83610f28565b9250828203905081811115611a7657611a75611a19565b5b92915050565b6000611a8782610f28565b9150611a9283610f28565b9250828202611aa081610f28565b91508282048414831517611ab757611ab6611a19565b5b5092915050565b60008160011c9050919050565b6000808291508390505b6001851115611b1557808604811115611af157611af0611a19565b5b6001851615611b005780820291505b8081029050611b0e85611abe565b9450611ad5565b94509492505050565b600082611b2e5760019050611bea565b81611b3c5760009050611bea565b8160018114611b525760028114611b5c57611b8b565b6001915050611bea565b60ff841115611b6e57611b6d611a19565b5b8360020a915084821115611b8557611b84611a19565b5b50611bea565b5060208310610133831016604e8410600b8410161715611bc05782820a905083811115611bbb57611bba611a19565b5b611bea565b611bcd8484846001611acb565b92509050818404811115611be457611be3611a19565b5b81810290505b9392505050565b6000611bfc82610f28565b9150611c0783610f28565b9250611c347fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8484611b1e565b905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b6000611c7682610f28565b9150611c8183610f28565b925082611c9157611c90611c3c565b5b828204905092915050565b600060ff82169050919050565b6000611cb482611c9c565b9150611cbf83611c9c565b925082611ccf57611cce611c3c565b5b828204905092915050565b6000611ce582611c9c565b9150611cf083611c9c565b9250828202611cfe81611c9c565b9150808214611d1057611d0f611a19565b5b5092915050565b6000611d2282611c9c565b9150611d2d83611c9c565b9250828203905060ff811115611d4657611d45611a19565b5b92915050565b6000611d5782610f28565b9150611d6283610f28565b9250828201905080821115611d7a57611d79611a19565b5b92915050565b6000611d8b82611c9c565b9150611d9683611c9c565b9250828201905060ff811115611daf57611dae611a19565b5b9291505056fe6080604052692a5a058fc295ed000000600155670de0b6b3a7640000600255600160035573fb9d8c2218e310a40276d1c6f6d0cf3f725fc0d7600460006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555065b5e620f480006005556005546006556b033b2e3c9fd0803ce800000060075534801560a357600080fd5b506116b5806100b36000396000f3fe6080604052600436106100a75760003560e01c806383caf2751161006457806383caf2751461019f57806390825c28146101ca578063c4d66de8146101f5578063cbcb31711461021e578063ed9772b614610249578063fc0c546a14610272576100a7565b8063017e7e58146100ac5780631d0806ae146100d75780633610724e146101025780637fd6f15c1461011e5780637ff9b5961461014957806380c08a5d14610174575b600080fd5b3480156100b857600080fd5b506100c161029d565b6040516100ce9190610d89565b60405180910390f35b3480156100e357600080fd5b506100ec6102c3565b6040516100f99190610dbd565b60405180910390f35b61011c60048036038101906101179190610e09565b6102c9565b005b34801561012a57600080fd5b50610133610684565b6040516101409190610dbd565b60405180910390f35b34801561015557600080fd5b5061015e61068a565b60405161016b9190610dbd565b60405180910390f35b34801561018057600080fd5b50610189610690565b6040516101969190610dbd565b60405180910390f35b3480156101ab57600080fd5b506101b4610696565b6040516101c19190610dbd565b60405180910390f35b3480156101d657600080fd5b506101df61069c565b6040516101ec9190610dbd565b60405180910390f35b34801561020157600080fd5b5061021c60048036038101906102179190610e62565b6106a6565b005b34801561022a57600080fd5b50610233610778565b6040516102409190610dbd565b60405180910390f35b34801561025557600080fd5b50610270600480360381019061026b9190610e8f565b61077e565b005b34801561027e57600080fd5b50610287610d24565b6040516102949190610d89565b60405180910390f35b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60055481565b60006064600354346102db9190610efe565b6102e59190610f6f565b90506000349050600082826102fa9190610fa0565b9050600060075411610341576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161033890611057565b60405180910390fd5b6000816001546103519190611077565b90506000600754670de0b6b3a76400008361036c9190610efe565b6103769190610f6f565b9050600081670de0b6b3a76400008561038f9190610efe565b6103999190610f6f565b9050600060648860646103ac9190611077565b6006546103b99190610efe565b6103c39190610f6f565b905080831115610408576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103ff906110f7565b60405180910390fd5b6000821161044b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161044290611163565b60405180910390fd5b816007541015610490576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610487906111cf565b60405180910390fd5b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33846040518363ffffffff1660e01b81526004016104eb9291906111ef565b6020604051808303816000875af115801561050a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061052e9190611250565b508360018190555081600760008282546105489190610fa0565b92505081905550826006819055506000600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1688611388906040516105a2906112ae565b600060405180830381858888f193505050503d80600081146105e0576040519150601f19603f3d011682016040523d82523d6000602084013e6105e5565b606091505b5050905080610629576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106209061130f565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff167f8fafebcaf9d154343dad25669bfa277f4fbacd7ac6b0c4fed522580e040a0f33848960405161067192919061132f565b60405180910390a2505050505050505050565b60035481565b60065481565b60015481565b60025481565b6000600154905090565b600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610735576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161072c906113ca565b60405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60075481565b600082116107c1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107b890611436565b60405180910390fd5b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231336040518263ffffffff1660e01b815260040161081d9190610d89565b602060405180830381865afa15801561083a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061085e919061146b565b9050828110156108a3576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161089a906114e4565b60405180910390fd5b6000600754670de0b6b3a7640000856108bc9190610efe565b6108c69190610f6f565b90506000670de0b6b3a7640000600a836108e09190610efe565b6108ea9190610f6f565b9050600a8111156108fa57600a90505b6000606482606461090b9190610fa0565b6006546109189190610efe565b6109229190610f6f565b90506000670de0b6b3a7640000828861093b9190610efe565b6109459190610f6f565b905080600154101561098c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161098390611550565b60405180910390fd5b60008760075461099c9190611077565b90506000826001546109ae9190610fa0565b9050600082670de0b6b3a7640000836109c79190610efe565b6109d19190610f6f565b905060648960646109e29190610fa0565b6006546109ef9190610efe565b6109f99190610f6f565b811015610a3b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a32906115bc565b60405180910390fd5b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166323b872dd33308d6040518463ffffffff1660e01b8152600401610a98939291906115dc565b6020604051808303816000875af1158015610ab7573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610adb9190611250565b50600060648786610aec9190610efe565b610af69190610f6f565b905060008186610b069190610fa0565b905060003373ffffffffffffffffffffffffffffffffffffffff168261138890604051610b32906112ae565b600060405180830381858888f193505050503d8060008114610b70576040519150601f19603f3d011682016040523d82523d6000602084013e610b75565b606091505b5050905080610bb9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bb09061165f565b60405180910390fd5b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168361138890604051610c03906112ae565b600060405180830381858888f193505050503d8060008114610c41576040519150601f19603f3d011682016040523d82523d6000602084013e610c46565b606091505b50508091505080610c8c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c839061130f565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff167fccbea4088a3b7ae9ca2d15fab9a9742a4075b4d7247768a1eecea917565aba008e84604051610cd492919061132f565b60405180910390a28c60076000828254610cee9190611077565b925050819055508660016000828254610d079190610fa0565b925050819055508360068190555050505050505050505050505050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610d7382610d48565b9050919050565b610d8381610d68565b82525050565b6000602082019050610d9e6000830184610d7a565b92915050565b6000819050919050565b610db781610da4565b82525050565b6000602082019050610dd26000830184610dae565b92915050565b600080fd5b610de681610da4565b8114610df157600080fd5b50565b600081359050610e0381610ddd565b92915050565b600060208284031215610e1f57610e1e610dd8565b5b6000610e2d84828501610df4565b91505092915050565b610e3f81610d68565b8114610e4a57600080fd5b50565b600081359050610e5c81610e36565b92915050565b600060208284031215610e7857610e77610dd8565b5b6000610e8684828501610e4d565b91505092915050565b60008060408385031215610ea657610ea5610dd8565b5b6000610eb485828601610df4565b9250506020610ec585828601610df4565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610f0982610da4565b9150610f1483610da4565b9250828202610f2281610da4565b91508282048414831517610f3957610f38610ecf565b5b5092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b6000610f7a82610da4565b9150610f8583610da4565b925082610f9557610f94610f40565b5b828204905092915050565b6000610fab82610da4565b9150610fb683610da4565b9250828203905081811115610fce57610fcd610ecf565b5b92915050565b600082825260208201905092915050565b7f426f6e64696e6743757276653a204e6f20746f6b656e7320696e20726573657260008201527f7665000000000000000000000000000000000000000000000000000000000000602082015250565b6000611041602283610fd4565b915061104c82610fe5565b604082019050919050565b6000602082019050818103600083015261107081611034565b9050919050565b600061108282610da4565b915061108d83610da4565b92508282019050808211156110a5576110a4610ecf565b5b92915050565b7f536c69707061676520746f6f206c6f7700000000000000000000000000000000600082015250565b60006110e1601083610fd4565b91506110ec826110ab565b602082019050919050565b60006020820190508181036000830152611110816110d4565b9050919050565b7f496e73756666696369656e742045544820746f20627579000000000000000000600082015250565b600061114d601783610fd4565b915061115882611117565b602082019050919050565b6000602082019050818103600083015261117c81611140565b9050919050565b7f496e73756666696369656e7420746f6b656e2072657365727665000000000000600082015250565b60006111b9601a83610fd4565b91506111c482611183565b602082019050919050565b600060208201905081810360008301526111e8816111ac565b9050919050565b60006040820190506112046000830185610d7a565b6112116020830184610dae565b9392505050565b60008115159050919050565b61122d81611218565b811461123857600080fd5b50565b60008151905061124a81611224565b92915050565b60006020828403121561126657611265610dd8565b5b60006112748482850161123b565b91505092915050565b600081905092915050565b50565b600061129860008361127d565b91506112a382611288565b600082019050919050565b60006112b98261128b565b9150819050919050565b7f466565207472616e73666572206661696c656400000000000000000000000000600082015250565b60006112f9601383610fd4565b9150611304826112c3565b602082019050919050565b60006020820190508181036000830152611328816112ec565b9050919050565b60006040820190506113446000830185610dae565b6113516020830184610dae565b9392505050565b7f426f6e64696e6743757276653a20416c726561647920696e697469616c697a6560008201527f6400000000000000000000000000000000000000000000000000000000000000602082015250565b60006113b4602183610fd4565b91506113bf82611358565b604082019050919050565b600060208201905081810360008301526113e3816113a7565b9050919050565b7f416d6f756e74206d7573742062652067726561746572207468616e207a65726f600082015250565b6000611420602083610fd4565b915061142b826113ea565b602082019050919050565b6000602082019050818103600083015261144f81611413565b9050919050565b60008151905061146581610ddd565b92915050565b60006020828403121561148157611480610dd8565b5b600061148f84828501611456565b91505092915050565b7f496e73756666696369656e7420746f6b656e2062616c616e6365000000000000600082015250565b60006114ce601a83610fd4565b91506114d982611498565b602082019050919050565b600060208201905081810360008301526114fd816114c1565b9050919050565b7f496e73756666696369656e74207669727475616c207265736572766500000000600082015250565b600061153a601c83610fd4565b915061154582611504565b602082019050919050565b600060208201905081810360008301526115698161152d565b9050919050565b7f536c69707061676520746f6f2068696768000000000000000000000000000000600082015250565b60006115a6601183610fd4565b91506115b182611570565b602082019050919050565b600060208201905081810360008301526115d581611599565b9050919050565b60006060820190506115f16000830186610d7a565b6115fe6020830185610d7a565b61160b6040830184610dae565b949350505050565b7f526566756e64207472616e73666572206661696c656400000000000000000000600082015250565b6000611649601683610fd4565b915061165482611613565b602082019050919050565b600060208201905081810360008301526116788161163c565b905091905056fea26469706673582212202a63fc236ce33f0d546866f50b521457ea5e9829998f1192feecc7375547fa6d64736f6c634300081c003360806040526012600260006101000a81548160ff021916908360ff1602179055506b033b2e3c9fd0803ce800000060035534801561003c57600080fd5b50604051611322380380611322833981810160405281019061005e9190610307565b826000908161006d91906105b3565b50816001908161007d91906105b3565b50600354600460008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef6003546040516101249190610694565b60405180910390a35050506106af565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61019b82610152565b810181811067ffffffffffffffff821117156101ba576101b9610163565b5b80604052505050565b60006101cd610134565b90506101d98282610192565b919050565b600067ffffffffffffffff8211156101f9576101f8610163565b5b61020282610152565b9050602081019050919050565b60005b8381101561022d578082015181840152602081019050610212565b60008484015250505050565b600061024c610247846101de565b6101c3565b9050828152602081018484840111156102685761026761014d565b5b61027384828561020f565b509392505050565b600082601f8301126102905761028f610148565b5b81516102a0848260208601610239565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006102d4826102a9565b9050919050565b6102e4816102c9565b81146102ef57600080fd5b50565b600081519050610301816102db565b92915050565b6000806000606084860312156103205761031f61013e565b5b600084015167ffffffffffffffff81111561033e5761033d610143565b5b61034a8682870161027b565b935050602084015167ffffffffffffffff81111561036b5761036a610143565b5b6103778682870161027b565b9250506040610388868287016102f2565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806103e457607f821691505b6020821081036103f7576103f661039d565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b60006008830261045f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610422565b6104698683610422565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b60006104b06104ab6104a684610481565b61048b565b610481565b9050919050565b6000819050919050565b6104ca83610495565b6104de6104d6826104b7565b84845461042f565b825550505050565b600090565b6104f36104e6565b6104fe8184846104c1565b505050565b5b81811015610522576105176000826104eb565b600181019050610504565b5050565b601f82111561056757610538816103fd565b61054184610412565b81016020851015610550578190505b61056461055c85610412565b830182610503565b50505b505050565b600082821c905092915050565b600061058a6000198460080261056c565b1980831691505092915050565b60006105a38383610579565b9150826002028217905092915050565b6105bc82610392565b67ffffffffffffffff8111156105d5576105d4610163565b5b6105df82546103cc565b6105ea828285610526565b600060209050601f83116001811461061d576000841561060b578287015190505b6106158582610597565b86555061067d565b601f19841661062b866103fd565b60005b828110156106535784890151825560018201915060208501945060208101905061062e565b86831015610670578489015161066c601f891682610579565b8355505b6001600288020188555050505b505050505050565b61068e81610481565b82525050565b60006020820190506106a96000830184610685565b92915050565b610c64806106be6000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce5671461013457806370a082311461015257806395d89b4114610182578063a9059cbb146101a0578063dd62ed3e146101d057610093565b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100e657806323b872dd14610104575b600080fd5b6100a0610200565b6040516100ad919061080d565b60405180910390f35b6100d060048036038101906100cb91906108c8565b61028e565b6040516100dd9190610923565b60405180910390f35b6100ee610380565b6040516100fb919061094d565b60405180910390f35b61011e60048036038101906101199190610968565b610386565b60405161012b9190610923565b60405180910390f35b61013c6104f0565b60405161014991906109d7565b60405180910390f35b61016c600480360381019061016791906109f2565b610503565b604051610179919061094d565b60405180910390f35b61018a61051b565b604051610197919061080d565b60405180910390f35b6101ba60048036038101906101b591906108c8565b6105a9565b6040516101c79190610923565b60405180910390f35b6101ea60048036038101906101e59190610a1f565b6105c0565b6040516101f7919061094d565b60405180910390f35b6000805461020d90610a8e565b80601f016020809104026020016040519081016040528092919081815260200182805461023990610a8e565b80156102865780601f1061025b57610100808354040283529160200191610286565b820191906000526020600020905b81548152906001019060200180831161026957829003601f168201915b505050505081565b600081600560003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161036e919061094d565b60405180910390a36001905092915050565b60035481565b600081600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610447576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161043e90610b0b565b60405180910390fd5b6104528484846105e5565b81600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546104de9190610b5a565b92505081905550600190509392505050565b600260009054906101000a900460ff1681565b60046020528060005260406000206000915090505481565b6001805461052890610a8e565b80601f016020809104026020016040519081016040528092919081815260200182805461055490610a8e565b80156105a15780601f10610576576101008083540402835291602001916105a1565b820191906000526020600020905b81548152906001019060200180831161058457829003601f168201915b505050505081565b60006105b63384846105e5565b6001905092915050565b6005602052816000526040600020602052806000526040600020600091509150505481565b80600460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610667576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161065e90610bda565b60405180910390fd5b80600460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546106b69190610b5a565b9250508190555080600460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461070c9190610bfa565b925050819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610770919061094d565b60405180910390a3505050565b600081519050919050565b600082825260208201905092915050565b60005b838110156107b757808201518184015260208101905061079c565b60008484015250505050565b6000601f19601f8301169050919050565b60006107df8261077d565b6107e98185610788565b93506107f9818560208601610799565b610802816107c3565b840191505092915050565b6000602082019050818103600083015261082781846107d4565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061085f82610834565b9050919050565b61086f81610854565b811461087a57600080fd5b50565b60008135905061088c81610866565b92915050565b6000819050919050565b6108a581610892565b81146108b057600080fd5b50565b6000813590506108c28161089c565b92915050565b600080604083850312156108df576108de61082f565b5b60006108ed8582860161087d565b92505060206108fe858286016108b3565b9150509250929050565b60008115159050919050565b61091d81610908565b82525050565b60006020820190506109386000830184610914565b92915050565b61094781610892565b82525050565b6000602082019050610962600083018461093e565b92915050565b6000806000606084860312156109815761098061082f565b5b600061098f8682870161087d565b93505060206109a08682870161087d565b92505060406109b1868287016108b3565b9150509250925092565b600060ff82169050919050565b6109d1816109bb565b82525050565b60006020820190506109ec60008301846109c8565b92915050565b600060208284031215610a0857610a0761082f565b5b6000610a168482850161087d565b91505092915050565b60008060408385031215610a3657610a3561082f565b5b6000610a448582860161087d565b9250506020610a558582860161087d565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610aa657607f821691505b602082108103610ab957610ab8610a5f565b5b50919050565b7f45524332303a20496e73756666696369656e7420616c6c6f77616e6365000000600082015250565b6000610af5601d83610788565b9150610b0082610abf565b602082019050919050565b60006020820190508181036000830152610b2481610ae8565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610b6582610892565b9150610b7083610892565b9250828203905081811115610b8857610b87610b2b565b5b92915050565b7f45524332303a20496e73756666696369656e742062616c616e63650000000000600082015250565b6000610bc4601b83610788565b9150610bcf82610b8e565b602082019050919050565b60006020820190508181036000830152610bf381610bb7565b9050919050565b6000610c0582610892565b9150610c1083610892565b9250828201905080821115610c2857610c27610b2b565b5b9291505056fea2646970667358221220062082818535c5bd95a974d3d58bb538aa9912e019a54e80cdc5b9952b47103064736f6c634300081c0033a26469706673582212201f0dfe821710f7ede979cef80226065f98c13a6ae999ebf8d0b78dc6fdd5265b64736f6c634300081c0033'; // Replace with actual factory bytecode
			  const factoryContract = new web3.eth.Contract(factoryABI);
		  
			  // Deploy the contract
			  const deployTx = factoryContract.deploy({
				data: factoryBytecode,
				arguments: [feeToSetter],
			  });
		  
			  // Estimate gas
			  const gas = await deployTx.estimateGas({ from: account.address });
		  
			  // Send transaction
			  const receipt = await deployTx.send({
				from: account.address,
				gas,
			  });
		  
			  console.log('Factory created successfully:', receipt);
		  
			  const factoryAddress = receipt.options.address || null;
			  const transactionHash = receipt.transactionHash || null;
		  
			  // Check for null values and handle errors
			  if (!factoryAddress || !transactionHash) {
				throw new Error('Factory deployment failed: Missing factory address or transaction hash.');
			  }
		  
			  // Return the factory response
			  return {
				factoryAddress,
				feeToSetter,
				transactionHash,
			  };
			} catch (error) {
			  console.error('Error during factory creation:', error.message);
			  throw new Error('Factory creation failed');
			}
		},	  
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
	introspection: true, // Enables introspection for Apollo Studio
});
server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
