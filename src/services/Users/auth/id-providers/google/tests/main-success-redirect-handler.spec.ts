/**
 * @jest-environment ./src/core/testing/test-env-with-config.ts
 */
import { ILogger } from "../../../../../../core/logging/i-logger";
import { getMockExpress } from "../../../../../../core/testing/get-mock-express";
import { ConfigProvider } from "../../../../../../core/config/config-provider";
import { getMainSuccessRedirectHandler } from "../main-success-redirect-handler";
import { getMockAuthenticator } from "../../../../testing/get-mock-authenticator";

describe("getMainSuccessRedirect", () => {
    let logger = {} as ILogger;
    let config = new ConfigProvider();

    beforeAll(() => {
        logger = globalThis.__logger as ILogger;
        config = new ConfigProvider();
    });

    it("should fail without a user in the request", async () => {
        const callback = getMainSuccessRedirectHandler(
            config,
            logger,
            getMockAuthenticator()
        );
        const mockExpress = getMockExpress();
        callback(mockExpress.Request, mockExpress.Response);
        expect(mockExpress.Response.status).toHaveBeenCalledWith(500);
        expect(mockExpress.Response.json).toHaveBeenCalledWith(
            expect.any(Object)
        );
    });

    it("should render a view for success", async () => {
        const mockExpress = getMockExpress();
        const callback = getMainSuccessRedirectHandler(
            config,
            logger,
            getMockAuthenticator()
        );
        mockExpress.Request.user = {
            email: "test@test.com",
            id: "some-id",
        };
        await callback(mockExpress.Request, mockExpress.Response);
        expect(mockExpress.Response.render).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object)
        );
    });
});
