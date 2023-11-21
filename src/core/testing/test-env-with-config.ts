import NodeEnvironment from "jest-environment-node";
import { ConfigFactory } from "../config/config-factory";
import dotenv from "dotenv";
import Logger from "../logging/logger";
import { IConfigProvider } from "../models/i-config-provider";

export default class TestEnvWithConfig extends NodeEnvironment {
    constructor(config: any, context: any) {
        super(config, context);
        dotenv.config();
    }

    async setup() {
        await super.setup();
        // Setup the test database
        this.global.__configProvider = ConfigFactory.create("test");
        this.global.__logger = new Logger(
            this.global.__configProvider as IConfigProvider
        );
    }
}
