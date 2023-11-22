import MongoTestEnvironment from "./test-env-with-mongo";
import App from "../../App";
import { ConfigProvider } from "../config/config-provider";
import Logger from "../logging/logger";

export default class ExpressAppEnvironment extends MongoTestEnvironment {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(config: any, context: any) {
        super(config, context);
    }

    async setup(): Promise<void> {
        await super.setup();
        const configProvider = this.global.__configProvider as ConfigProvider;
        const logger = this.global.__logger as Logger;
        this.global.__app = new App(configProvider, logger);
    }

    async teardown(): Promise<void> {
        await super.teardown();
        if (this.global.__app) {
            ((await this.global.__app) as App).stop();
            this.global.__app = null;
        }
    }
}
