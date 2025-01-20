const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    username: String!
    bio: String
    walletAddress: String!
    parentAddress: String!
    createdAt: String
  }

  type Auth {
    walletAddress: String!
    parentAddress: String!
    encryptedPrivateKey: String!
    createdAt: String
  }

  type AuthResponse {
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

  type Query {
    getUserDetails(username: String!): User
    getMintDetails(mint: String!): Token
    getMintValue(mint: String!): Trade
    getBalance(tokenAddress: ID!, userAddress: ID!): Float
    getTransactions(MintOrAddress: String!, start: Int, limit: Int): [Transaction]!
  }

  type Mutation {
    metaMaskAuth(signature: String!, parentAddress: String!, username: String, bio: String): AuthResponse
  }
`;

module.exports = typeDefs;
