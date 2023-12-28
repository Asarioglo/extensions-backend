import { Application, Router } from "express";
import { IMicroservice } from "../../core/interfaces/i-microservice";
import Api from "./api";
import mongoose from "mongoose";
import MongoUserRepo from "./database/mongo/mongo-user-repo";
import { ILogger } from "../../core/logging/i-logger";
import { IConfigProvider } from "../../core/interfaces/i-config-provider";
import Logger from "../../core/logging/logger";
import passport from "passport";
import configurePassport from "./auth/passport";
import GoogleProvider, {
    GoogleCredentials,
} from "./auth/id-providers/google-id-provider";

export class UsersService implements IMicroservice {
    async launch(app: Application, config: IConfigProvider): Promise<Router> {
        const logger = Logger.getLogger("users.index.ts");

        const connection = await connectDB(config, logger);

        const userRepo = new MongoUserRepo(connection);

        const googleConfig: GoogleCredentials = {
            clientID: config.get("google_client_id"),
            clientSecret: config.get("google_client_secret"),
            callbackURL: config.get("google_callback_url"),
        };

        const googleProvider = new GoogleProvider(
            "google-main",
            googleConfig,
            userRepo,
            config
        );

        const router = Api(userRepo);
        app.use(passport.initialize());
        app.use(passport.session());
        configurePassport(userRepo, router, [googleProvider]);

        return router;
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
