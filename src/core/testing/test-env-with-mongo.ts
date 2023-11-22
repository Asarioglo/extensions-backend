import { MongoMemoryServer } from "mongodb-memory-server";
import { IConfigProvider } from "../interfaces/i-config-provider";
import dotenv from "dotenv";
import TestEnvWithConfig from "./test-env-with-config";

export default class MongoTestEnvironment extends TestEnvWithConfig {
    private __dbInstance: MongoMemoryServer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(config: any, context: any) {
        super(config, context);
        dotenv.config();
    }

    async setup() {
        await super.setup();
        // Setup the test database
        this.__dbInstance = await MongoMemoryServer.create();
        (this.global.__configProvider as IConfigProvider).set(
            "mongo_uri",
            this.__dbInstance.getUri()
        );
    }

    async teardown() {
        await super.teardown();
        // Cleanup the test database
        await this.__dbInstance.stop();
    }
}
