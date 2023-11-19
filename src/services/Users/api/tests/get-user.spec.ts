import "jest";
import supertest from "supertest";
import { StatusCodes } from "http-status-codes";
import IntegrationHelpers from "../../../../testing/integration-helpers";
import { IConfigProvider } from "../../../../core/models/i-config-provider";
import App from "../../../../App";

describe("GET /users/me", () => {
    let app: App;
    let config: IConfigProvider;
    let uri_prefix: string;

    beforeAll(async () => {
        app = await IntegrationHelpers.getApp();
        config = IntegrationHelpers.getConfig();
        uri_prefix = config.get("route_prefix", "");
    });

    afterEach(async () => {
        await app?.stop();
    });

    it("should return 200 OK", async () => {
        await supertest(app.getExpressApp())
            .get(`${uri_prefix}/users/me`)
            .set("Accept", "application/json")
            .expect(StatusCodes.OK);
    });
});
