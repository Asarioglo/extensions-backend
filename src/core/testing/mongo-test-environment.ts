import NodeEnvironment from "jest-environment-node";
import { MongoMemoryServer } from "mongodb-memory-server";
import { IConfigProvider } from "../models/i-config-provider";
import { ConfigFactory } from "../config/config-factory";

export default class MongoTestEnvironment extends NodeEnvironment {
    private __dbInstance: MongoMemoryServer;
    private __configProvider: IConfigProvider;

    constructor(config: any, context: any) {
        super(config, context);
        this.__configProvider = ConfigFactory.create("test");
        this.global.__configProvider = this.__configProvider;
    }

    async setup() {
        await super.setup();
        // Setup the test database
        this.__dbInstance = await MongoMemoryServer.create();
        this.__configProvider.set("mongo_uri", this.__dbInstance.getUri());
    }

    async teardown() {
        await super.teardown();
        // Cleanup the test database
        await this.__dbInstance.stop();
    }
}
