import { Request, Response } from "express";
import { PubSub } from "graphql-subscriptions";

export interface GqlContext {
  req: Request;
  res: Response;
  pubsub: PubSub;
}
