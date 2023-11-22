import { Application, Router } from "express";
import { IMicroservice } from "../../core/interfaces/i-microservice";
import Api from "./api";
import mongoose from "mongoose";
import MongoUserRepo from "./database/mongo/mongo-user-repo";
import { ILogger } from "../../core/logging/i-logger";
import { IConfigProvider } from "../../core/interfaces/i-config-provider";
import configurePassport from "./auth/passport";
import passport from "passport";

export class UsersService implements IMicroservice {
    async launch(
        app: Application,
        config: IConfigProvider,
        logger: ILogger
    ): Promise<Router> {
        logger.debug("UsersService.launch()");

        const connection = await connectDB(config, logger);

        const userRepo = new MongoUserRepo(connection);

        configurePassport(passport, userRepo, [], logger);
        app.use(passport.initialize());
        app.use(passport.session());

        return Api(userRepo, logger);
    }
}

const connectDB = async (
    config: IConfigProvider,
    logger: ILogger
): Promise<mongoose.Connection> => {
    const conn_str = config.get("users_mongo_uri");
    if (!conn_str) {
        logger.error(
            "Missing users_mongo_uri. Check that the config provider and the envvars are set correctly."
        );
        throw new Error("Missing users_mongo_uri");
    }
    const dbName = config.get("users_mongo_db_name");
    if (!dbName) {
        logger.error(
            "Missing users_mongo_db_name. Check that the config provider and the envvars are set correctly."
        );
        throw new Error("Missing users_mongo_db_name");
    }

    logger.debug("Connecting to MongoDB", {
        conn_str: conn_str.split("@")[1], // to not console senstiive info
        dbName,
    });

    let connection: mongoose.Connection;
    try {
        connection = await mongoose
            .createConnection(conn_str, { dbName })
            .asPromise();
    } catch (err) {
        logger.error("Error connecting to MongoDB", { err });
        throw err;
    }

    if (!connection) {
        logger.error("Connection to MongoDB failed");
        throw new Error("Connection to MongoDB failed");
    }
    return connection;
};
