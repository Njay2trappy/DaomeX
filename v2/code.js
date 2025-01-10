const Web3 = require('web3');
const axios = require('axios');
const { gql, ApolloServer } = require('apollo-server');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path'); // For handling file paths
const mongoose = require('mongoose');
const crypto = require('crypto');

const web3 = new Web3('https://rpc.airdao.io');
const factoryABI = [
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
const bondingCurveABI = [
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
				"name": "totalcost",
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
const factoryAddress = '0x09f2Be8796242b0d49f3Aba2a04ADBddfAA9cEec';
const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/yourdatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Schema for storing API keys
const apiKeySchema = new mongoose.Schema({
  userId: { type: String, required: true }, // User ID associated with the API key
  apiKey: { type: String, required: true, unique: true }, // Unique API key
  createdAt: { type: Date, default: Date.now }, // When the key was created
  expiresAt: { type: Date }, // Optional expiration date
});

// Create the model
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// Function to generate a new API key
async function generateApiKey(userId) {
  try {
    const apiKey = crypto.randomBytes(32).toString('hex'); // Generate a random 64-character API key

    const newApiKey = new ApiKey({
      userId,
      apiKey,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Optional: Expiry in 30 days
    });

    await newApiKey.save();

    return {
      success: true,
      apiKey: newApiKey.apiKey,
      expiresAt: newApiKey.expiresAt,
    };
  } catch (error) {
    console.error('Error generating API key:', error);
    return {
      success: false,
      message: 'Failed to generate API key',
    };
  }
}

const typeDefs = gql`
	type Token {
		address: ID!
		name: String!
		symbol: String!
		totalSupply: Float!
		balanceOf: Float!
		bondingCurve: ID!
		creator: ID!
		transactionHash: ID!
		description: String
		imageURI: String!
		twitter: String
		telegram: String
		website: String
		metadataURI: String
		identifier: String
		tokenPrice: Float
		virtualReserve: Float
		tokenReserve: Float
		marketCap: Float
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
		tokenAddress: String!
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
		getContractDetails(addressOrIdentifier: String!): TokenDetails!
	}

	type ApiKeyResponse {
		success: Boolean!
		apiKey: String
		expiresAt: String
		message: String
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
			addressOrIdentifier: String!, 
			amount: Float!, 
			slippageTolerance: Int!, 
			privateKey: String!
		): TokenPurchase!	
		approveToken(
			addressOrIdentifier: String!
			amount: Float!
			privateKey: String!
  		): ApproveTokenResponse!
		sellTokens(
			addressOrIdentifier: String!
			amount: Float!
			slippageTolerance: Float!
			privateKey: String!
		): SellTokenResponse!
		autoSell(
			addressOrIdentifier: String!
			amount: Float
			slippageTolerance: Float!
			privateKey: String!
  		): SellTokenResponse!
		createApiKey(userId: String!): ApiKeyResponse!
	}
`;

const resolvers = {
  Query: {
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
	getContractDetails: async (_, { addressOrIdentifier }) => {
		try {
		  let tokenAddress;
  
		  // Check if the input is an identifier (ends with DAOME)
		  if (addressOrIdentifier.endsWith('DAOME')) {
			tokenAddress = addressOrIdentifier.replace('DAOME', '');
		  } else {
			tokenAddress = addressOrIdentifier;
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
  },
  Mutation: {
		createToken: async (_, { name, symbol, privateKey, description, image, twitter, telegram, website }) => {
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
			const imagePath = path.join(__dirname, 'car.png'); // Ensure this file exists
			if (!fs.existsSync(imagePath)) {
			throw new Error('Image file not found: car.png');
			}

			const formData = new FormData();
			formData.append('file', fs.createReadStream(imagePath)); // Upload the image

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
			const totalSupply = 1_000_000_000; // Fixed total supply
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
			const identifier = receipt.events.TokenCreated.returnValues.identifier;
			const transactionHash = receipt.transactionHash;
	
			// Fetch bonding curve details
			const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
			const tokenPrice = await bondingCurveContract.methods.tokenPrice().call();
			const virtualReserve = await bondingCurveContract.methods.virtualReserve().call();
			const tokenReserve = await bondingCurveContract.methods.tokenReserve().call();
			const marketCap = await bondingCurveContract.methods.getMarketCap().call();
	
			return {
				address: tokenAddress,
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
				identifier,
				twitter,
				telegram,
				website,
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
		buyTokens: async (_, { addressOrIdentifier, amount, slippageTolerance, privateKey }) => {
			const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(account);
		
			try {
			let contractAddress;
		
			// Determine if the input is an identifier or a contract address
			if (addressOrIdentifier.endsWith('DAOME')) {
				contractAddress = addressOrIdentifier.replace('DAOME', '');
				console.log(`Identifier provided, derived contract address: ${contractAddress}`);
			} else {
				contractAddress = addressOrIdentifier;
				console.log(`Contract address provided: ${contractAddress}`);
			}
		
			// Fetch bonding curve address and token details from the factory
			const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
			const bondingCurveAddress = tokenDetails[4]; // Assuming bonding curve address is at index 4
			const tokenName = tokenDetails[0]; // Assuming token name is at index 0
		
			console.log(`Bonding curve address fetched: ${bondingCurveAddress}`);
			console.log(`Token name fetched: ${tokenName}`);
		
			const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
		
			console.log(`Buying tokens from bonding curve: ${bondingCurveAddress}`);
			console.log(`Amount: ${amount}, Slippage Tolerance: ${slippageTolerance}`);
		
			// Estimate gas and execute the transaction
			const tx = bondingCurveContract.methods.buyTokens(slippageTolerance);
			const gas = await tx.estimateGas({
				from: account.address,
				value: web3.utils.toWei(amount.toString(), 'ether'),
			});
		
			console.log(`Estimated gas: ${gas}`);
		
			const receipt = await tx.send({
				from: account.address,
				gas,
				value: web3.utils.toWei(amount.toString(), 'ether'),
			});
		
			console.log('Transaction successful:', receipt);
		
			const timestamp = new Date().toISOString();
			const buyer = account.address;
			const transactionHash = receipt.transactionHash;
			const tokenAddress = await bondingCurveContract.methods.token().call();
		
			// Extract purchase details from the receipt
			const event = receipt.events.TokensPurchased;
			const quantity = parseFloat(web3.utils.fromWei(event.returnValues.amount, 'ether'));
			const totalCost = parseFloat(web3.utils.fromWei(event.returnValues.totalcost, 'ether')); // Added totalCost from updated event
		
			return {
				token: tokenName,
				tokenAddress,
				quantity,
				totalCost, // Total cost including fees
				amountPaid: parseFloat(amount), // User's input amount
				timestamp,
				buyer,
				transactionHash,
				bondingCurveAddress,
			};
			} catch (error) {
			console.error('Error during token purchase:', error);
			throw new Error('Token purchase failed');
			}
		},			  
		sellTokens: async (_, { addressOrIdentifier, amount, slippageTolerance, privateKey }) => {
			const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(account);
		
			try {
			let contractAddress;
		
			// Check if the input is an identifier (ends with DAOME)
			if (addressOrIdentifier.endsWith('DAOME')) {
				contractAddress = addressOrIdentifier.replace('DAOME', '');
				console.log(`Identifier provided, contract address derived: ${contractAddress}`);
			} else {
				contractAddress = addressOrIdentifier;
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
		approveToken: async (_, { addressOrIdentifier, amount, privateKey }) => {
			try {
			// 1. Derive the true contract address by removing 'DAOME' if present
			let contractAddress;
			if (addressOrIdentifier.endsWith('DAOME')) {
				contractAddress = addressOrIdentifier.replace('DAOME', '');
				console.log(`Identifier provided, stripped 'DAOME' -> Contract Address: ${contractAddress}`);
			} else {
				contractAddress = addressOrIdentifier;
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
		autoSell: async (_, { addressOrIdentifier, amount, slippageTolerance, privateKey }) => {
			try {
			// 1. Parse input: strip 'DAOME' if present
			let contractAddress;
			if (addressOrIdentifier.endsWith('DAOME')) {
				contractAddress = addressOrIdentifier.replace('DAOME', '');
				console.log(`Identifier detected, stripped "DAOME": ${contractAddress}`);
			} else {
				contractAddress = addressOrIdentifier;
				console.log(`Raw contract address provided: ${contractAddress}`);
			}
		
			// 2. Create account from private key
			const account = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(account);
		
			// 3. Fetch token details from the factory
			const tokenDetails = await factoryContract.methods.getTokenDetails(contractAddress).call();
			const tokenName = tokenDetails[0]; // Assuming token name is at index 0
			const bondingCurveAddress = tokenDetails[4]; // Assuming bondingCurveAddress is at index 4
		
			console.log(`Token name: ${tokenName}`);
			console.log(`Bonding curve address (fetched from factory): ${bondingCurveAddress}`);
		
			// 4. Create contract instances
			const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);
			const tokenContract = new web3.eth.Contract(ERC20ABI, contractAddress);
		
			console.log(`Slippage Tolerance: ${slippageTolerance}`);
		
			// 5. Fetch and validate user balance
			const userBalance = await tokenContract.methods.balanceOf(account.address).call();
			console.log(`User balance: ${web3.utils.fromWei(userBalance, 'ether')} tokens`);
		
			if (web3.utils.toBN(userBalance).lte(web3.utils.toBN(0))) {
				throw new Error('Insufficient token balance to sell');
			}
		
			// Use the user's full balance minus 1 wei for the sale
			const adjustedAmount = web3.utils.toBN(userBalance).sub(web3.utils.toBN(1));
			console.log(`Adjusted amount to sell (in wei): ${adjustedAmount.toString()}`);
		
			// 6. Approve the bonding curve to spend user's full token balance
			console.log('Approving bonding curve to spend full token balance...');
			const approveTx = tokenContract.methods.approve(bondingCurveAddress, userBalance);
			const approveGas = await approveTx.estimateGas({ from: account.address });
			await approveTx.send({ from: account.address, gas: approveGas });
			console.log('Approval successful');
		
			// 7. Execute the sellTokens transaction
			console.log('Executing sellTokens...');
			const sellTx = bondingCurveContract.methods.sellTokens(
				adjustedAmount.toString(),
				slippageTolerance
			);
			const sellGas = await sellTx.estimateGas({ from: account.address });
			const receipt = await sellTx.send({ from: account.address, gas: sellGas });
		
			console.log('Transaction receipt:', receipt);
		
			// 8. Extract relevant info from the receipt
			const timestamp = new Date().toISOString();
			const seller = account.address;
			const transactionHash = receipt.transactionHash;
		
			const tokensBurnedEvent = receipt.events.TokensBurned;
			const quantitySold = parseFloat(web3.utils.fromWei(tokensBurnedEvent.returnValues.amount, 'ether'));
			const amountReceived = parseFloat(web3.utils.fromWei(tokensBurnedEvent.returnValues.netRefund, 'ether'));
		
			// 9. Return relevant fields
			return {
				token: tokenName,
				tokenAddress: contractAddress,
				quantitySold,
				amountReceived,
				timestamp,
				seller,
				transactionHash,
				bondingCurveAddress,
			};
			} catch (error) {
			console.error('Error during auto-sell:', error);
			throw new Error('Auto-sell failed');
			}
		},
		createApiKey: async (_, { userId }) => {
			const response = await generateApiKey(userId);
			return response;
		},
	},
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
