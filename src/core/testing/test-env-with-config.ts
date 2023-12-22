import NodeEnvironment from "jest-environment-node";
import { ConfigFactory } from "../config/config-factory";
import dotenv from "dotenv";
// import MockLogger from "./mock-logger";
import { ILogger } from "../logging/i-logger";
import Logger from "../logging/logger";

export default class TestEnvWithConfig extends NodeEnvironment {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(config: any, context: any) {
        super(config, context);
        dotenv.config();
    }

    async setup() {
        await super.setup();
        // Setup the test database
        const config = ConfigFactory.create("test");
        this.global.__configProvider = config;
        // this.global.__logger = new MockLogger();
        this.global.__logger = Logger.getLogger("test-logger");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async handleTestEvent(event: any) {
        if (event.name === "test_start") {
            // log the test name
            (this.global.__logger as ILogger).info(
                `|------------------------------------------------------------`
            );
            (this.global.__logger as ILogger).info(
                `|  RUNNING: ${event.test.name}`
            );
            (this.global.__logger as ILogger).info(
                `|------------------------------------------------------------`
            );
        }
    }
}
