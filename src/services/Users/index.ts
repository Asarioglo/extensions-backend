import { Router } from "express";
import { IMicroservice } from "../../core/interfaces/i-microservice";
import Api from "./api";
import mongoose from "mongoose";
import MongoUserRepo from "./database/mongo/mongo-user-repo";
import { ILogger } from "../../core/logging/i-logger";
import { IConfigProvider } from "../../core/interfaces/i-config-provider";

export class UsersService implements IMicroservice {
    launch(config: IConfigProvider, logger: ILogger): Router {
        const conn_str = config.get("users_mongo_uri");
        if (!conn_str) {
            throw new Error("Missing users_mongo_uri");
        }
        const connection = mongoose.createConnection(conn_str, {});

        const userRepo = new MongoUserRepo(connection);

        return Api(userRepo);
    }
}
