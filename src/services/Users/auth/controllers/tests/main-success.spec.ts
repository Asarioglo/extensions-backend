/**
 * @jest-environment ./src/core/testing/test-env-with-express-app.ts
 */
import "jest";
import supertest from "supertest";
import { StatusCodes } from "http-status-codes";
import { IConfigProvider } from "../../../../../core/interfaces/i-config-provider";
import App from "../../../../../App";
import { ILogger } from "../../../../../core/logging/i-logger";
import strings from "../../../views/assets/text/en-us.json";
import { Request, Response } from "express";

// NOTE: This view doesn't have an associated controller.

describe("GET /users/auth/login", () => {
    let app!: App;
    let config: IConfigProvider;
    let uri_prefix: string | null = null;
    let logger: ILogger;

    beforeAll(async () => {
        logger = globalThis.__logger as ILogger;
    });

    beforeEach(async () => {
        logger.debug("[GET /users/login] Initializing app instance");
        app = globalThis.__app as App;
        config = globalThis.__configProvider as IConfigProvider;
        uri_prefix = config.get("route_prefix", "");
    });

    afterEach(async () => {
        logger.debug("[GET /users/login] Cleaning up app instance");
        await app.stop();
    });

    it("should return a rendered login view", async () => {
        logger.debug("[GET /users/login] should return 200 OK");
        app.addCustomMiddleware(
            "test-main-success",
            (req: Request, res: Response) => {
                const vars = {
                    ...strings.loginSuccessful,
                    auth_token: "my-dummy-token",
                    extensionId: "my-extension-id",
                };
                res.render("users/pages/main-success.ejs", vars);
            }
        );
        logger.debug("[GET /users/login] Middleware registered");
        await app.start(true);
        logger.debug("[GET /users/login] App started");
        const response = await supertest(app.getExpressApp())
            .get(`${uri_prefix}/test-main-success`)
            .set("Accept", "*")
            .expect((res) => {
                if (res.status !== StatusCodes.OK) {
                    logger.error(`${res.status} ${res.text}`);
                }
            })
            .expect(StatusCodes.OK)
            .expect("Content-Type", /html/);

        const authStrings = strings.loginSuccessful;
        for (const s in authStrings) {
            expect(response.text).toContain(authStrings[s]);
        }
        expect(response.text).toContain("my-dummy-token");
        expect(response.text).toContain("my-extension-id");
        logger.debug("[GET /users/login] Request completed");
    });
});
