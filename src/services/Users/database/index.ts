import mongoose from "mongoose";
import { IConfigProvider } from "../../../core/interfaces/i-config-provider";
import Logger from "../../../core/logging/logger";

export const start = async (
    config: IConfigProvider
): Promise<mongoose.Connection> => {
    const logger = Logger.getLogger("users/database/index.ts");

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
