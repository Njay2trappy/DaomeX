const { ApolloServer, gql } = require('apollo-server');
const Web3 = require('web3');
const fs = require('fs');
const { ERC20_ABI, CONTRACT_BYTECODE } = require('./tokenDatas');

const web3 = new Web3('https://network.ambrosus.io/');

const saveToFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
};

const saveWalletDetails = (contractAddress, bondingCurveWallet, burnCurveWallet) => {
  const walletDetails = {
    contractAddress,
    bondingCurve: bondingCurveWallet.address,
    burnCurve: burnCurveWallet.address,
    bondingCurvePrivateKey: bondingCurveWallet.privateKey,
    burnCurvePrivateKey: burnCurveWallet.privateKey
  };
  const filePath = `./source/${contractAddress}.json`;
  saveToFile(filePath, walletDetails);
};

const typeDefs = gql`
  type Token {
    name: String!
    symbol: String!
    totalSupply: Float!
    contractAddress: String!
    bondingCurve: String!
    burnCurve: String!
    marketCap: Float!
    burnedAmount: Float!
  }

  type Query {
    getToken(contractAddress: String!): Token
  }

  type Mutation {
    createToken(name: String!, symbol: String!, payerPrivateKey: String!): Token!
  }
`;

const resolvers = {
  Query: {
    getToken: (_, { contractAddress }) => {
      const filePath = `./source/${contractAddress}.json`;
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      throw new Error('Token not found');
    }
  },

  Mutation: {
    createToken: async (_, { name, symbol, payerPrivateKey }) => {
      const payerAccount = web3.eth.accounts.privateKeyToAccount(payerPrivateKey);
      const payerAddress = payerAccount.address;
      const bondingCurveWallet = web3.eth.accounts.create();
      const burnCurveWallet = web3.eth.accounts.create();

      const contract = new web3.eth.Contract(ERC20_ABI);
      const tx = contract.deploy({ data: CONTRACT_BYTECODE, arguments: [name, symbol, bondingCurveWallet.address] });

      const deployGas = await tx.estimateGas({ from: payerAddress });
      const deployTx = {
        from: payerAddress,
        data: tx.encodeABI(),
        gas: deployGas,
        chainId: await web3.eth.getChainId()
      };

      const signedTx = await web3.eth.accounts.signTransaction(deployTx, payerPrivateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      const contractAddress = receipt.contractAddress;
      saveWalletDetails(contractAddress, bondingCurveWallet, burnCurveWallet);

      return {
        name,
        symbol,
        totalSupply: 100_000_000,
        contractAddress,
        bondingCurve: bondingCurveWallet.address,
        burnCurve: burnCurveWallet.address,
        marketCap: 20000,
        burnedAmount: 0
      };
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
