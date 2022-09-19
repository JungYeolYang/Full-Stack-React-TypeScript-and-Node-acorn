import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import { createConnection } from "typeorm";
import { register, login, logout } from "./repo/UserRepo";
import bodyParser from "body-parser";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import http from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import typeDefs from "./gql/typeDefs";
import resolvers from "./gql/resolvers";
import {
  createThread,
  getThreadById,
  getThreadsByCategoryId,
} from "./repo/ThreadRepo";

console.log(process.env.NODE_ENV);
require("dotenv").config();

const main = async () => {
  const app = express();
  app.use(
    cors({
      credentials: true,
      origin: process.env.CLIENT_URL,
    })
  );
  const router = express.Router();
  await createConnection();

  const redis = new Redis({
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
  });
  const RedisStore = connectRedis(session);
  const redisStore = new RedisStore({
    client: redis,
  });

  app.use(bodyParser.json());

  app.use(
    session({
      store: redisStore,
      name: process.env.COOKIE_NAME,
      sameSite: "Strict",
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        path: "/",
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
      },
    } as any)
  );
  app.use(router);
  router.get("/", (req, res, next) => {
    req.session!.test = "hello";
    res.send("hello");
  });
  router.post("/register", async (req, res, next) => {
    try {
      console.log("params", req.body);
      const userResult = await register(
        req.body.email,
        req.body.userName,
        req.body.password
      );
      if (userResult && userResult.user) {
        res.send(`new user created, userId: ${userResult.user.id}`);
      } else if (userResult && userResult.messages) {
        res.send(userResult.messages[0]);
      } else {
        next();
      }
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      console.log("params", req.body);
      const userResult = await login(req.body.userName, req.body.password);
      if (userResult && userResult.user) {
        req.session!.userId = userResult.user?.id;
        res.send(`user logged in, userId:
    ${req.session!.userId}`);
      } else if (userResult && userResult.messages) {
        res.send(userResult.messages[0]);
      } else {
        next();
      }
    } catch (ex) {
      res.send(ex.message);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      console.log("params", req.body);
      const msg = await logout(req.body.userName);
      if (msg) {
        req.session!.userId = null;
        res.send(msg);
      } else {
        next();
      }
    } catch (ex) {
      console.log(ex);
      res.send(ex.message);
    }
  });

  router.post("/createthread", async (req, res, next) => {
    try {
      console.log("userId", req.session);
      console.log("body", req.body);
      const msg = await createThread(
        req.session!.userId, // notice this is from session!
        req.body.categoryId,
        req.body.title,
        req.body.body
      );

      res.send(msg);
    } catch (ex) {
      console.log(ex);
      res.send(ex.message);
    }
  });
  router.post("/thread", async (req, res, next) => {
    try {
      const threadResult = await getThreadById(req.body.id);

      if (threadResult && threadResult.entity) {
        res.send(threadResult.entity.title);
      } else if (threadResult && threadResult.messages) {
        res.send(threadResult.messages[0]);
      }
    } catch (ex) {
      console.log(ex);
      res.send(ex.message);
    }
  });
  router.post("/threadsbycategory", async (req, res, next) => {
    try {
      const threadResult = await getThreadsByCategoryId(req.body.categoryId);

      if (threadResult && threadResult.entities) {
        let items = "";
        console.log(threadResult.entities);
        threadResult.entities.forEach((th) => {
          items += th.title + ", ";
        });
        res.send(items);
      } else if (threadResult && threadResult.messages) {
        res.send(threadResult.messages[0]);
      }
    } catch (ex) {
      console.log(ex);
      res.send(ex.message);
    }
  });
  const httpServer = http.createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }: any) => ({ req, res }),
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
      }),
    ],
  });

  apolloServer.start().then(() => {
    apolloServer.applyMiddleware({
      app,
      cors: false,
    });
    httpServer.listen({ port: process.env.SERVER_PORT }, () => {
      console.log(
        `Server ready at http://localhost:${process.env.SERVER_PORT}${apolloServer.graphqlPath}`
      );
    });
  });
};

main();
