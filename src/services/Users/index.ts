import { Application, Router } from "express";
import { IMicroservice } from "../../core/interfaces/i-microservice";
import { start as startAPI } from "./api";
import MongoUserRepo from "./database/mongo/mongo-user-repo";
import { IConfigProvider } from "../../core/interfaces/i-config-provider";
import Logger from "../../core/logging/logger";
import { start as startAuth } from "./auth";
import { start as startDB } from "./database";
import path from "path";

export class UsersService implements IMicroservice {
    async launch(app: Application, config: IConfigProvider): Promise<Router> {
        const logger = Logger.getLogger("users/index.ts");

        logger.debug("starting users service");
        const router = Router();

        logger.debug("Starting the database connection");
        const connection = await startDB(config);

        logger.debug("Starting the authenticator");
        const userRepo = new MongoUserRepo(connection);
        const authConfig = config
            .clone()
            .set(
                "route_prefix",
                path.join(config.get("route_prefix", ""), "auth")
            );
        const { authenticator, authRouter } = startAuth(
            authConfig,
            userRepo,
            app
        );
        router.use("/auth", authRouter);

        logger.debug("Starting the API");
        const apiConfig = config
            .clone()
            .set(
                "route_prefix",
                path.join(config.get("route_prefix", ""), "api")
            );
        const apiRouter = startAPI(apiConfig, userRepo, authenticator);
        router.use("/api", apiRouter);

        return router;
    }
}
