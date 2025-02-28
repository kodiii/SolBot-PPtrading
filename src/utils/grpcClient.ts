import Client from "@triton-one/yellowstone-grpc";
import * as dotenv from "dotenv";

dotenv.config();


let client: Client | null = null;

export function getClient(): Client {
  if (!client) {
    client = new Client(process.env.GRPC_ENDPOINT!, undefined, undefined);
  }
  return client;
}