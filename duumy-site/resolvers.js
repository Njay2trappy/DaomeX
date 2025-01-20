const crypto = require("crypto");
const Web3 = require("web3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { UserModel, AuthModel, Token, Trade } = require("./db"); // ✅ Corrected impor
const { transactionsConnection } = require("./transactions")
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
    /*getTransactions: async (_, { MintOrAddress, start = 0, limit }, { user }) => {
      if (!user) {
        throw new Error("❌ Authentication required. Please log in.");
      }
    
      try {
        let contractAddress;
    
        // Check if the input is a mint or contract address
        if (MintOrAddress.endsWith("DAOME")) {
          contractAddress = MintOrAddress.replace("DAOME", "");
          console.log(`Mint provided, derived contract address: ${contractAddress}`);
        } else {
          contractAddress = MintOrAddress;
          console.log(`Contract address provided: ${contractAddress}`);
        }
    
        // Validate the contract address
        if (!web3.utils.isAddress(contractAddress)) {
          throw new Error("Invalid contract address");
        }
    
        // Query the transactions database
        const transactionCollection = transactionsConnection.collection(contractAddress);
    
        let transactionsQuery = transactionCollection.find({});
    
        // Apply range filters
        if (start >= 0) {
          transactionsQuery = transactionsQuery.skip(start);
        }
        if (limit > 0) {
          transactionsQuery = transactionsQuery.limit(limit);
        }
    
        const transactions = await transactionsQuery.toArray();
    
        console.log(
          `📜 Retrieved ${transactions.length} transactions for contract: ${contractAddress}`
        );
    
        return transactions.map((tx) => ({
          type: tx.type,
          quantity: tx.quantity || tx.quantitySold,
          amount: tx.amountPaid || tx.amountReceived,
          timestamp: tx.timestamp,
          user: tx.buyer || tx.seller,
          transactionHash: tx.transactionHash,
        }));
      } catch (error) {
        console.error("❌ Error fetching transactions:", error);
        throw new Error("Failed to fetch transactions.");
      }
    },*/
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
  },

  Mutation: {
    // ✅ MetaMask Authentication & User Registration/Login
    metaMaskAuth: async (_, { signature, parentAddress, username, bio }) => {
      console.log(`🔑 Authentication request from ${parentAddress}`);

      // ✅ Check if user already exists
      let existingUser = await UserModel.findOne({ parentAddress });

      if (!existingUser) {
        // ✅ Step 1: New User Registration
        if (!username) {
          throw new Error("❌ New users must provide a username.");
        }

        const generatedWallet = web3.eth.accounts.create();
        const walletAddress = generatedWallet.address;
        const privateKey = generatedWallet.privateKey;

        console.log(`🎉 New user: ${username}.DAOME with wallet ${walletAddress}`);

        // ✅ Encrypt Private Key (Secure Storage)
        const saltRounds = 12;
        const encryptedPrivateKey = await bcrypt.hash(privateKey, saltRounds);

        // ✅ Step 2: Store User & Auth Data
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

        // ✅ Insert into MongoDB
        await UserModel.create(userProfile);
        await AuthModel.create(authData);

        console.log(`✅ User Profile & Auth Data Stored for ${username}.DAOME`);

        existingUser = userProfile;
      } else {
        console.log(`✅ Existing user logged in: ${existingUser.username}`);
      }

      // ✅ Generate JWT Token
      const token = jwt.sign(
        {
          walletAddress: existingUser.walletAddress,
          parentAddress,
        },
        SECRET_KEY,
        { expiresIn: "2h" }
      );

      return {
        token,
        walletAddress: existingUser.walletAddress,
        username: existingUser.username,
        bio: existingUser.bio,
      };
    },
  },
};

module.exports = resolvers;
