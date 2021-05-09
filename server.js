const express = require("express");
const mongoose = require("mongoose");

// middleware
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dev = process.env.NODE_ENV !== "production";
// allow use of variables
require("dotenv").config({ path: dev ? ".env" : "variables.env" });

const Recipe = require("./models/Recipe");
const User = require("./models/User");

const { ApolloServer } = require("apollo-server-express");
const { typeDefs } = require("./schema");
const { resolvers } = require("./resolvers");

// conect to database
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

// initialize application
const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));

// Set up JWT authentication middleware
app.use(async (req, res, next) => {
  const token = req.headers["authorization"];
  if (token !== "null") {
    try {
      const currentUser = await jwt.verify(token, process.env.SECRET);
      req.currentUser = currentUser;
    } catch (err) {
      console.error(err);
    }
  }
  next();
});

// connect schemas to GraphQL
const startApolloServer = async () => {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: {
      Recipe,
      User,
      currentUser: {},
    },
    playground: {
      endpoint: "/graphql",
      settings: {
        "editor.theme": "dark",
      },
    },
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
};
startApolloServer();

const PORT = process.env.PORT || 4444;

app.listen(PORT, () => {
  console.log(`Server listening on PORT ${PORT}`);
});
