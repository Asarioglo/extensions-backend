import App from "./App";
import { ConfigFactory } from "./core/config/config-factory";
import dotenv from "dotenv";
import Logger from "./core/logging/logger";
import DevLogger from "./core/logging/dev-logger";
import { UsersService } from "./services/Users";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const config = ConfigFactory.create(process.env.NODE_ENV);
const logger =
    env === "development"
        ? new DevLogger(config, "index.ts")
        : new Logger(config, "index.ts");

const app = new App(config, logger);

app.addMicroservice("/users", new UsersService());

app.start().then(() => {
    logger.info("App initialization complete.");
});
