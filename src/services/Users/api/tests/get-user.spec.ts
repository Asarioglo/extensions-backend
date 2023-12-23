/**
 * @jest-environment ./src/core/testing/test-env-with-express-app.ts
 */
import "jest";
import supertest from "supertest";
import { StatusCodes } from "http-status-codes";
import { IConfigProvider } from "../../../../core/interfaces/i-config-provider";
import App from "../../../../App";
import getUser from "../get-user";
import { ILogger } from "../../../../core/logging/i-logger";

describe("GET /users/me", () => {
    let app!: App;
    let config: IConfigProvider;
    let uri_prefix: string | null = null;
    let logger: ILogger;

    beforeAll(async () => {
        logger = globalThis.__logger as ILogger;
    });

    beforeEach(async () => {
        logger.debug("[GET /users/me] Initializing app instance");
        app = globalThis.__app as App;
        config = globalThis.__configProvider as IConfigProvider;
        uri_prefix = config.get("route_prefix", "");
    });

    afterEach(async () => {
        logger.debug("[GET /users/me] Cleaning up app instance");
        await app.stop();
    });

    it("should return 200 OK", async () => {
        logger.debug("[GET /users/me] should return 200 OK");
        app.addCustomMiddleware("test-get-user", getUser);
        logger.debug("[GET /users/me] Middleware registered");
        await app.start(true);
        logger.debug("[GET /users/me] App started");
        await supertest(app.getExpressApp())
            .get(`${uri_prefix}/test-get-user`)
            .set("Accept", "application/json")
            .expect(StatusCodes.OK);
        logger.debug("[GET /users/me] Request completed");
    });
});
