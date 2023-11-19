import { Router } from "express";
import { IMicroservice } from "../../core/models/i-microservice";
import Api from "./api";
import { ConfigProvider } from "../../core/config/config-provider";
import mongoose from "mongoose";
import MongoUserRepo from "./database/mongo/mongo-user-repo";

export class UsersService implements IMicroservice {
    launch(config: ConfigProvider): Router {
        const conn_str = config.get("users_mongo_uri");
        if (!conn_str) {
            throw new Error("Missing users_mongo_uri");
        }
        const connection = mongoose.createConnection(conn_str, {});

        const userRepo = new MongoUserRepo(connection);

        return Api();
    }
}
