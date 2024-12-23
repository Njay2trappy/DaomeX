// Import required modules
const { ApolloServer, gql } = require('apollo-server');
const Web3 = require('web3');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ERC20_ABI, CONTRACT_BYTECODE } = require('./tokenData');

// Web3 setup
const web3 = new Web3('https://network.ambrosus.io/');

// Utility functions
const saveToFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
};

const saveWalletDetails = (contractAddress, bondingCurveWallet, associatedBondingCurveWallet) => {
  const walletDetails = {
    contractAddress,
    bondingCurve: bondingCurveWallet.address,
    bondingCurvePrivateKey: bondingCurveWallet.privateKey,
    associatedBondingCurve: associatedBondingCurveWallet.address,
    associatedBondingCurvePrivateKey: associatedBondingCurveWallet.privateKey,
  };
  const filePath = `./source/${contractAddress}.json`;
  saveToFile(filePath, walletDetails);
};

const getAMBMarketCap = async () => {
  try {
    const response = await axios.get('https://backend.x3na.com/v1/price');
    const ambPrice = parseFloat(response.data);
    if (ambPrice) {
      return ambPrice;
    } else {
      console.error("Price not found in API response.", response.data);
      throw new Error("Failed to fetch AMB market cap: Price not found.");
    }
  } catch (error) {
    console.error("Error fetching AMB market cap:", error);
    throw new Error("Failed to fetch AMB market cap.");
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
    associatedBondingCurve: String!
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
        console.error("Error fetching token:", error);
        throw new Error("Failed to fetch token.");
      }
    },
  },

  Mutation: {
    createToken: async (_, { name, symbol, payerPrivateKey, description, twitter, telegram, website }) => {
      try {
        const imageURI = "https://ipfs.io/ipfs/QmNX2Lydfw4Ty2eHSeZVmQwHinUWeyesVRdKhhR4Uuz6kd";
        const payerAccount = web3.eth.accounts.privateKeyToAccount(payerPrivateKey);
        const payerAddress = payerAccount.address;

        // Generate new wallets
        const bondingCurveWallet = web3.eth.accounts.create();
        const associatedBondingCurveWallet = web3.eth.accounts.create();

        // Fetch AMB price for market cap calculation
        const ambPrice = await getAMBMarketCap();
        console.log("Fetched AMB price:", ambPrice);

        // Fund the bonding curve wallet with 0.5 AMB to cover token creation gas fees
        const gasPrice = await web3.eth.getGasPrice();
        const fundBondingCurveTx = {
          from: payerAddress,
          to: bondingCurveWallet.address,
          value: web3.utils.toWei('0.5', 'ether'),
          gas: 21000,
          gasPrice,
          chainId: await web3.eth.getChainId(),
        };
        const signedFundBondingCurveTx = await web3.eth.accounts.signTransaction(fundBondingCurveTx, payerPrivateKey);
        await web3.eth.sendSignedTransaction(signedFundBondingCurveTx.rawTransaction);
        console.log("Bonding curve wallet funded.");

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
            { trait_type: "Creator", value: payerAddress },
            { trait_type: "Network", value: "AirDAO" },
            { trait_type: "Total Supply", value: 1_000_000_000 },
          ],
        };

        // Upload metadata to IPFS
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
        console.log("✅ Metadata uploaded to IPFS:", metadataURI);

        // Deploy the token contract (paid by bonding curve wallet)
        const contract = new web3.eth.Contract(ERC20_ABI);
        const supply = 1_000_000_000;
        console.log("Total supply set to 1 billion tokens.");

        const tx = contract.deploy({
          data: CONTRACT_BYTECODE,
          arguments: [name, symbol, supply, bondingCurveWallet.address, metadataURI],
        });

        const deployGas = await tx.estimateGas({ from: bondingCurveWallet.address });
        console.log("Estimated deployment gas:", deployGas);

        const deployTx = {
          from: bondingCurveWallet.address,
          data: tx.encodeABI(),
          gas: deployGas,
          gasPrice,
          chainId: await web3.eth.getChainId(),
        };

        const signedDeployTx = await web3.eth.accounts.signTransaction(deployTx, bondingCurveWallet.privateKey);
        console.log("Deployment transaction signed. Broadcasting...");

        const receipt = await web3.eth.sendSignedTransaction(signedDeployTx.rawTransaction);
        console.log("Token contract deployed!");
        console.log("Contract Address:", receipt.contractAddress);
        console.log("Transaction Hash:", receipt.transactionHash);

        // Check token balance of bonding curve wallet after deployment
        const deployedContract = new web3.eth.Contract(ERC20_ABI, receipt.contractAddress);
        const balance = await deployedContract.methods.balanceOf(bondingCurveWallet.address).call();
        console.log(`Bonding Curve Wallet (${bondingCurveWallet.address}) Token Balance:`, balance);

        saveWalletDetails(receipt.contractAddress, bondingCurveWallet, associatedBondingCurveWallet);

        const marketCap = 5000;
        const ambMarketCap = 5000 / ambPrice;

        const tokenDetails = {
          name,
          symbol,
          totalSupply: supply,
          imageURI,
          metadataURI,
          contractAddress: receipt.contractAddress,
          transactionHash: receipt.transactionHash,
          bondingCurve: bondingCurveWallet.address,
          associatedBondingCurve: associatedBondingCurveWallet.address,
          creator: payerAddress,
          createdTimestamp: new Date().toISOString(),
          completion: false,
          marketCap,
          ambMarketCap,
          twitter: twitter || null,
          telegram: telegram || null,
          website: website || null,
        };

        const filePath = `./coins/${receipt.contractAddress}.json`;
        saveToFile(filePath, tokenDetails);

        return tokenDetails;
      } catch (error) {
        console.error("Error creating token:", error);
        throw new Error("Failed to create token.");
      }
    },
  },
};

// Start Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
