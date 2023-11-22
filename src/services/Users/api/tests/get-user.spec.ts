/**
 * @jest-environment ./src/core/testing/test-env-with-express-app.ts
 */
import "jest";
import supertest from "supertest";
import { StatusCodes } from "http-status-codes";
import { IConfigProvider } from "../../../../core/interfaces/i-config-provider";
import App from "../../../../App";
import getUser from "../get-user";

describe("GET /users/me", () => {
    let app!: App;
    let config: IConfigProvider;
    let uri_prefix: string | null = null;

    beforeEach(async () => {
        app = globalThis.__app as App;
        config = globalThis.__configProvider as IConfigProvider;
        uri_prefix = config.get("route_prefix", "");
    });

    afterEach(async () => {
        await app.stop();
    });

    it("should return 200 OK", async () => {
        app.addCustomMiddleware("test-get-user", getUser);
        await app.start();
        await supertest(app.getExpressApp())
            .get(`${uri_prefix}/test-get-user`)
            .set("Accept", "application/json")
            .expect(StatusCodes.OK);
    });
});
