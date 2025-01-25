const { ApolloServer } = require("apollo-server-express");
const express = require("express");
const mongoose = require("mongoose");
const { graphqlUploadExpress } = require("graphql-upload");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const typeDefs = require("./schema");
const bodyParser = require("body-parser");
const resolvers = require("./resolvers");
require("dotenv").config(); // Ensure dotenv is required at the top


const SECRET_KEY = process.env.SECRET_KEY || "verifeiddata23";
const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());


app.use(graphqlUploadExpress());

async function startServer() {
    const app = express();

    // ✅ Add middleware for file uploads
    app.use(graphqlUploadExpress());

    // ✅ Apollo Server setup
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            const authHeader = req.headers.authorization || "";
            const token = authHeader.replace("Bearer ", "").trim();

            if (!token) {
                return { user: null }; // No authentication token provided
            }

            try {
                // ✅ Decode JWT to extract walletAddress
                const decoded = jwt.verify(token, SECRET_KEY);
                return { user: { walletAddress: decoded.walletAddress } };
            } catch (error) {
                console.error("❌ Invalid Token:", error.message);
                return { user: null }; // Invalid token
            }
        },
    });

    // ✅ Start the Apollo server
    await server.start();

    // ✅ Apply Apollo server middleware to Express
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer().catch((error) => {
    console.error("❌ Error starting server:", error);
});
