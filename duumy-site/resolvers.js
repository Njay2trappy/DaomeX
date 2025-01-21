const crypto = require("crypto");
const Web3 = require("web3");
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
const { holdersConnection, HolderModel } = require("./holders"); // ✅ Ensure this is correctly imported from db.js
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
	getTokens: async (_, { limit = 100 }, { user }) => {
		if (!user || !user.walletAddress) {
			throw new Error("❌ Authentication required. Please log in.");
		}
	
		try {
			console.log(`📡 Fetching tokens for user: ${user.walletAddress}`);
	
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
    // ✅ User Sign-Up
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
			console.log(`Creating token: ${name}, Symbol: ${symbol}`);
	
			// Step 1: Verify user balance
			const userBalance = await web3.eth.getBalance(user.walletAddress);
			const requiredBalance = web3.utils.toWei('100', 'ether');
	
			if (web3.utils.toBN(userBalance).lt(web3.utils.toBN(requiredBalance))) {
				throw new Error('Insufficient balance to create token');
			}
	
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
			console.log(`Metadata uploaded to IPFS: ${metadataURI}`);
	
			// Step 3: Encode the transaction for the frontend to sign
			const tx = factoryContract.methods.createToken(name, symbol, metadataURI, imageURI);
			const gas = await tx.estimateGas({ from: user.walletAddress, value: requiredBalance });
	
			const encodedTx = {
				from: user.walletAddress, // Ensure it matches the connected MetaMask account
				to: factoryContract.options.address,
				data: tx.encodeABI(),
				value: requiredBalance.toString(),
			};
	
			console.log(`📤 Encoded Transaction:`, encodedTx);
	
			return { encodedTx }; // Send to the frontend for signing
		} catch (error) {
			console.error('❌ Error during token creation:', error.message);
			throw new Error('Token creation failed.');
		}
	},			
  },
};

module.exports = resolvers;
