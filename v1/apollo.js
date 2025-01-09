const Web3 = require('web3');
const axios = require('axios');
const { gql, ApolloServer } = require('apollo-server');

const web3 = new Web3('https://rpc.airdao.io');
const factoryABI = [
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
				"name": "",
				"type": "address"
			}
		],
		"name": "tokenToBondingCurve",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const bondingCurveABI = [/* Bonding Curve ABI from Remix */];
const factoryAddress = '0xYourFactoryAddress';
const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);

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
  }

  type BondingCurveDetails {
    tokenPrice: Float
    virtualReserve: Float
    tokenReserve: Float
    slope: Float
    feePercent: Int
    token: ID!
  }

  type Query {
    getFactoryAddress: String
    getBondingCurveDetails(bondingCurveAddress: ID!): BondingCurveDetails
  }

  type Mutation {
    createToken(
      name: String!, 
      symbol: String!, 
      privateKey: String!, 
      description: String, 
      imageURI: String!,
      twitter: String,
      telegram: String,
      website: String
    ): Token
    buyTokens(bondingCurveAddress: ID!, slippageTolerance: Int!, privateKey: String!): String
    sellTokens(bondingCurveAddress: ID!, amount: Float!, slippageTolerance: Int!, privateKey: String!): String
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
      const token = await bondingCurveContract.methods.token().call();

      return {
        tokenPrice: parseFloat(web3.utils.fromWei(tokenPrice, 'ether')),
        virtualReserve: parseFloat(web3.utils.fromWei(virtualReserve, 'ether')),
        tokenReserve: parseFloat(web3.utils.fromWei(tokenReserve, 'ether')),
        slope: parseFloat(web3.utils.fromWei(slope, 'ether')),
        feePercent: parseInt(feePercent),
        token
      };
    }
  },
  Mutation: {
    createToken: async (_, { name, symbol, privateKey, description, imageURI, twitter, telegram, website }) => {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(account);

      const tx = factoryContract.methods.createToken(name, symbol);
      const gas = await tx.estimateGas({ from: account.address, value: web3.utils.toWei('100', 'ether') });

      const receipt = await tx.send({
        from: account.address,
        gas,
        value: web3.utils.toWei('100', 'ether')
      });

      const tokenAddress = receipt.events.TokenCreated.returnValues.token;
      const bondingCurveAddress = receipt.events.TokenCreated.returnValues.bondingCurve;
      const transactionHash = receipt.transactionHash;
      const creator = account.address;
      const totalSupply = 1_000_000_000;

      // Prepare metadata
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
        twitter,
        telegram,
        website,
        metadataURI
      };
    },
    buyTokens: async (_, { bondingCurveAddress, slippageTolerance, privateKey }) => {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(account);
      const bondingCurveContract = new web3.eth.Contract(bondingCurveABI, bondingCurveAddress);

      const tx = bondingCurveContract.methods.buyTokens(slippageTolerance);
      const gas = await tx.estimateGas({ from: account.address, value: web3.utils.toWei('1', 'ether') });

      await tx.send({
        from: account.address,
        gas,
        value: web3.utils.toWei('1', 'ether')
      });

      return 'Tokens Purchased';
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
