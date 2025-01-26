const express = require("express");
const http = require("http");
const { ApolloServer } = require("apollo-server-express");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { graphqlUploadExpress } = require("graphql-upload");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");

// ✅ Load environment variables
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "verifeiddata23";

async function startServer() {
    const app = express();

    // ✅ Enable CORS
    app.use(cors());

    // ✅ Body Parser Middleware
    app.use(bodyParser.json());

    // ✅ File Upload Middleware
    app.use(graphqlUploadExpress());

    // ✅ Create GraphQL schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // ✅ Create HTTP Server
    const httpServer = http.createServer(app);

    // ✅ Initialize Apollo Server
    const server = new ApolloServer({
        schema,
        csrfPrevention: true, // Recommended for security
        introspection: true, // ✅ Allows GraphiQL access
        context: ({ req }) => {
            const authHeader = req?.headers?.authorization || "";
            const token = authHeader.replace("Bearer ", "").trim();
            let user = null;

            if (token) {
                try {
                    // ✅ Decode JWT to extract walletAddress
                    const decoded = jwt.verify(token, SECRET_KEY);
                    user = { walletAddress: decoded.walletAddress };
                } catch (error) {
                    console.error("❌ Invalid Token:", error.message);
                }
            }

            return { user }; // ✅ No WebSockets, no pubsub
        },
    });

    // ✅ Start Apollo Server
    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4000;

    // ✅ Start HTTP Server (NO WEBSOCKETS)
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
}

// ✅ Start Server & Handle Errors
startServer().catch((error) => console.error("❌ Error starting server:", error));