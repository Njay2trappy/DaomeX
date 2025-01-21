const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Upload
  type User {
    username: String!
    bio: String
    walletAddress: String!
    parentAddress: String
  }

  type Auth {
    walletAddress: String!
    parentAddress: String!
    encryptedPrivateKey: String!
    createdAt: String
  }

  type AuthResponse {
    parentAddress: String!
    token: String!
    walletAddress: String!
    username: String!
    bio: String
  }
  type Token {
    mint: String!
    address: String!
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
  type Trade {
		mint: String!
		contractAddress: String!
		tokenPrice: Float!
		virtualReserve: Float!
		tokenReserve: Float!
		marketCap: Float!
	}
  type Transaction {
		type: String!
		quantity: Float!
		amount: Float
		timestamp: String!
		user: String
		transactionHash: String!
	}
  type Holder {
    address: String!
    balance: Float!
    percentageHold: Float!
  }
  type TokenCreationResponse {
    metadataURI: String!
    encodedTx: EncodedTransaction!
  }

  type EncodedTransaction {
    from: String!
    to: String!
    data: String!
    value: String!
}

  type Query {
    getUserDetails(username: String!): User
    getParentDetails(parentAddress: String!): User
    getMintDetails(mint: String!): Token
    getMintValue(mint: String!): Trade
    getBalance(tokenAddress: ID!, userAddress: ID!): Float
    getTransactions(MintOrAddress: String!, start: Int, limit: Int): [Transaction]!
    getHolders(mintOrAddress: String!, order: String = "desc", limit: Int = 100): [Holder]!
    getTokens(limit: Int = 100): [Token!]!
  }

  type Mutation {
    metaMaskAuth(parentAddress: String!, signature: String!): AuthResponse
    signUpUser(parentAddress: String!, username: String!, bio: String): AuthResponse
    uploadImage(file: Upload!): String! # Returns the IPFS URI of the uploaded image
    createToken(
      name: String!,
      symbol: String!,
      description: String,
      twitter: String,
      telegram: String,
      website: String,
      imageURI: String!
    ): TokenCreationResponse!
  }
`;

module.exports = typeDefs;
