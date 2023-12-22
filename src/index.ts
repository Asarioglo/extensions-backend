import App from "./App";
import { ConfigFactory } from "./core/config/config-factory";
import dotenv from "dotenv";
import { UsersService } from "./services/Users";
import Logger from "./core/logging/logger";
import { LogLevels } from "./core/logging/config";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const config = ConfigFactory.create(process.env.NODE_ENV);

// Otherwise default to Console logger with Debug level
if (env !== "development") Logger.setLevel(LogLevels.HTTP);
const logger = Logger.getLogger("index.ts");

const app = new App(config);

app.addMicroservice("/users", new UsersService());

app.start().then(() => {
    logger.info("App initialization complete.");
});
