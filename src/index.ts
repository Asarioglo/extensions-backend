import App from "./App";
import { ConfigFactory } from "./core/config/config-factory";
import dotenv from "dotenv";
import Logger from "./core/logging/logger";
import DevLogger from "./core/logging/dev-logger";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const config = ConfigFactory.create(process.env.NODE_ENV);
const logger =
    env === "development" ? new DevLogger(config) : new Logger(config);

const app = new App(config, logger);

app.start().then(() => {
    logger.info("App initialization complete.");
});
