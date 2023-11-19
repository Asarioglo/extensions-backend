/**
 * @jest-environment ./src/core/testing/express-app-environment.ts
 */
import "jest";
import supertest from "supertest";
import { StatusCodes } from "http-status-codes";
import { IConfigProvider } from "../../../../core/models/i-config-provider";
import App from "../../../../App";
import getUser from "../get-user";

describe("GET /users/me", () => {
    let app: App;
    let config: IConfigProvider;
    let uri_prefix: string;

    beforeEach(async () => {
        app = globalThis.__app as App;
        config = globalThis.__configProvider as IConfigProvider;
        uri_prefix = config.get("route_prefix", "");
    });

    afterEach(async () => {
        await app?.stop();
        app = null as any;
    });

    it("should return 200 OK", async () => {
        app.addCustomMiddleware("test-get-user", getUser);
        await supertest(app.getExpressApp())
            .get(`${uri_prefix}/test-get-user`)
            .set("Accept", "application/json")
            .expect(StatusCodes.OK);
    });
});
