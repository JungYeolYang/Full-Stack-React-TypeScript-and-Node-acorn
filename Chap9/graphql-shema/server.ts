import express from "express";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import http from "http";
import { PubSub } from "graphql-subscriptions";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";

const app = express();
const httpServer = http.createServer(app);
const pubsub = new PubSub();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql-ws",
});

const serverCleanup = useServer(
  {
    schema,
    context: () => {
      return { pubsub };
    },
  },
  wsServer
);

const apolloServer = new ApolloServer({
  schema,
  context: ({ req, res }: any) => {
    return { req, res, pubsub };
  },
  csrfPrevention: true,
  cache: "bounded",
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

apolloServer.start().then(() => {
  apolloServer.applyMiddleware({ app, cors: false });
  httpServer.listen({ port: 8000 }, () => {
    console.log("GraphQL server ready.");
  });
});
