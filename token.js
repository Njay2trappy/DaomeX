const { ApolloServer, gql } = require('apollo-server');
const Web3 = require('web3');
const axios = require('axios');
const fs = require('fs');
const { ERC20_ABI, CONTRACT_BYTECODE } = require('./tokenData');

// Web3 setup
const web3 = new Web3('https://network.ambrosus.io/');

// Utility functions
const saveToFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
  } catch (error) {
    console.error(`❌ Error saving to file ${filePath}:`, error);
  }
};

const saveWalletDetails = (contractAddress, bondingCurveWallet) => {
  try {
    const walletDetails = {
      contractAddress,
      bondingCurve: bondingCurveWallet.address,
      bondingCurvePrivateKey: bondingCurveWallet.privateKey,
    };
    const filePath = `./source/${contractAddress}.json`;
    saveToFile(filePath, walletDetails);
  } catch (error) {
    console.error('❌ Error saving wallet details:', error);
  }
};

const getAMBMarketCap = async () => {
  try {
    const response = await axios.get('https://backend.x3na.com/v1/price');
    const ambPrice = parseFloat(response.data);
    if (!ambPrice) throw new Error('Price not found in API response.');
    return ambPrice;
  } catch (error) {
    console.error('❌ Error fetching AMB market cap:', error);
    throw new Error('Failed to fetch AMB market cap.');
  }
};

// GraphQL schema
const typeDefs = gql`
  type Token {
    name: String!
    symbol: String!
    totalSupply: Float!
    imageURI: String!
    metadataURI: String!
    contractAddress: String!
    transactionHash: String!
    bondingCurve: String!
    creator: String!
    createdTimestamp: String!
    completion: Boolean!
    marketCap: Float!
    ambMarketCap: Float!
    twitter: String
    telegram: String
    website: String
  }

  type Query {
    getTokens(contractAddress: String!): Token
  }

  type Mutation {
    createToken(
      name: String!,
      symbol: String!,
      payerPrivateKey: String!,
      description: String!,
      twitter: String,
      telegram: String,
      website: String
    ): Token!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    getTokens: (_, { contractAddress }) => {
      try {
        const filePath = `./coins/${contractAddress}.json`;
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
          throw new Error(`Token with contract address ${contractAddress} not found.`);
        }
      } catch (error) {
        console.error('❌ Error fetching token:', error);
        throw new Error('Failed to fetch token.');
      }
    },
  },

  Mutation: {
    createToken: async (_, { name, symbol, payerPrivateKey, description, twitter, telegram, website }) => {
      try {
        const imageURI = "https://ipfs.io/ipfs/QmNX2Lydfw4Ty2eHSeZVmQwHinUWeyesVRdKhhR4Uuz6kd";
        const payerAccount = web3.eth.accounts.privateKeyToAccount(payerPrivateKey);
        const payerAddress = payerAccount.address;

        // Create bonding curve wallet
        const bondingCurveWallet = web3.eth.accounts.create();
        const bondingCurveAddress = bondingCurveWallet.address;

        console.log("🔑 Bonding curve wallet generated:", bondingCurveAddress);

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
        };

        // Pin metadata to IPFS
        let metadataURI;
        try {
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
          metadataURI = `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`;
        } catch (error) {
          console.error('❌ Error uploading metadata to IPFS:', error);
          throw new Error('Failed to pin metadata to IPFS.');
        }

        // Deploy contract from payer wallet
        const contract = new web3.eth.Contract(ERC20_ABI);
        const tx = contract.deploy({
          data: CONTRACT_BYTECODE,
          arguments: [name, symbol, totalSupply, bondingCurveAddress],
        });

        const gasEstimate = await tx.estimateGas({ from: payerAddress });
        const gasPrice = await web3.eth.getGasPrice();

        const deployTx = {
          from: payerAddress,
          data: tx.encodeABI(),
          gas: gasEstimate,
          gasPrice,
          chainId: await web3.eth.getChainId(),
        };

        const signedDeployTx = await web3.eth.accounts.signTransaction(deployTx, payerPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedDeployTx.rawTransaction);

        const contractAddress = receipt.contractAddress;
        console.log(`🚀 Contract deployed at: ${contractAddress}`);

        saveWalletDetails(contractAddress, bondingCurveWallet);

        const ambPrice = await getAMBMarketCap();
        const marketCap = 5000;
        const ambMarketCap = marketCap / ambPrice;

        const tokenDetails = {
          name,
          symbol,
          totalSupply,
          imageURI,
          metadataURI,
          contractAddress,
          transactionHash: receipt.transactionHash,
          bondingCurve: bondingCurveAddress,
          creator: payerAddress,
          createdTimestamp: new Date().toISOString(),
          completion: true,
          marketCap,
          ambMarketCap,
          twitter,
          telegram,
          website,
        };

        const filePath = `./coins/${contractAddress}.json`;
        saveToFile(filePath, tokenDetails);

        return tokenDetails;
      } catch (error) {
        console.error('❌ Error creating token:', error);
        throw new Error('Token creation failed.');
      }
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
}).catch(error => {
  console.error("❌ Server startup error:", error);
});
