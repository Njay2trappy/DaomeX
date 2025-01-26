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
  type TransactionConfirmationResponse {
    success: Boolean!
    message: String!
    transactionHash: String!
  }
  type Holder {
    address: String!
    balance: Float!
    percentageHold: Float!
  }
  type TokenCreationResponse {
    encodedTx: EncodedTransaction!            # The unique mint identifier for the token
  }
  type TokenBuyResponse {
    encodedTx: EncodedTransaction!            # The unique mint identifier for the token
  }
  type TokenPurchase {
		mint: String!
		quantity: Float!
		amountPaid: Float!
		timestamp: String!
		seller: String!
		transactionHash: String!
		bondingCurve: String!
  }
  type TokenSale {
		mint: String!
		quantity: Float!
		amountReceived: Float!
		timestamp: String!
		seller: String!
		transactionHash: String!
		bondingCurve: String!
  }
  type EncodedTransaction {
    from: String!
    to: String!
    data: String!
    value: String!
    gas: String!
  }
  type ConfirmTokenCreationResponse {
    name: String! # Name of the token
    symbol: String! # Symbol of the token
    description: String # Description of the token
    twitter: String # Twitter handle of the project
    telegram: String # Telegram link of the project
    website: String # Website of the project
    tokenAddress: String!
    bondingCurveAddress: String!
    mint: String!
    imageURI: String!
    metadataURI: String!
  }
  type ApproveTokenResponse {
    encodedTx: EncodedTransaction!
    token: String!
    tokenAddress: String!
    bondingCurveAddress: String!
    amountApproved: Float!
  }

  type Query {
    getUserDetails(username: String!): User
    getParentDetails(parentAddress: String!): User
    getMintDetails(mint: String!): Token
    getMintValue(mint: String!): Trade
    getBalance(tokenAddress: ID!, userAddress: ID!): Float
    getTransactions(MintOrAddress: String!, start: Int, limit: Int): [Transaction]!
    getHolders(mintOrAddress: String!, order: String = "desc", limit: Int = 100): [Holder]!
    getTokens(limit: Int): [Token]
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
    confirmTokenCreation(
      transactionHash: String!
      name: String!
      symbol: String!
      description: String
      twitter: String
      telegram: String
      website: String
    ): Token
    buyTokens(MintOrAddress: String!, amount: String!, slippageTolerance: String!): TokenBuyResponse!
    sellTokens(MintOrAddress: String!, amount: String!, slippageTolerance: String!): TokenBuyResponse!
    confirmTokenPurchase(transactionHash: String!): TokenPurchase!
    confirmTokenSale(transactionHash: String!): TokenSale!
    BackbuyTokens(
			MintOrAddress: String!, 
			amount: Float!, 
			slippageTolerance: Int!, 
			privateKey: String!
			apiKey: String!
		): TokenPurchase!
    approveToken(MintOrAddress: String!, amount: String!): ApproveTokenResponse!
  }

  type Subscription{
    tokenAdded: Token
  }
`;

module.exports = typeDefs;
