/**
 * @jest-environment ./src/core/testing/test-env-with-express-app.ts
 */

import App from "../App";
import { ConfigFactory } from "../core/config/config-factory";
import { ConfigProvider } from "../core/config/config-provider";
import { ILogger } from "../core/logging/i-logger";
import Logger from "../core/logging/logger";
import { MockMicroservice } from "../core/testing/mock-microservice";
import supertest from "supertest";

describe("App", () => {
    let appInstance: App;
    let logger: ILogger;
    const configProvider = ConfigFactory.create("test");
    const baseURLPrefix = configProvider.get("route_prefix", "");

    beforeAll(async () => {
        logger = Logger.getLogger("app.spec.ts");
    });

    beforeEach(async () => {
        appInstance = globalThis.__app;
    });

    afterEach(async () => {
        await appInstance.stop();
    });

    it("should be defined", () => {
        expect(App).toBeDefined();
        expect(appInstance).toBeDefined();
    });

    it("Should return null, express app is not initialized", () => {
        expect(appInstance.getExpressApp()).toBeNull();
    });

    it("Should fail with no required configs", () => {
        const configProvider = new ConfigProvider();
        expect(() => {
            new App(configProvider);
        }).toThrow();
        configProvider.set("port", "1234");
        expect(() => {
            new App(configProvider);
        }).not.toThrow();
    });

    it("Should launch and start listening", async () => {
        await appInstance.start();
        expect(appInstance.getExpressApp()).toBeDefined();
    });

    it("Should handle 404 routes", async () => {
        await appInstance.start();
        await supertest(appInstance.getExpressApp())
            .get("/nonexistent-route")
            .set("Accept", "application/json")
            .expect(404)
            .expect("Content-Type", /json/);
        await supertest(appInstance.getExpressApp())
            .get(`${baseURLPrefix}/nonexistent-route`)
            .set("Accept", "application/json")
            .expect(404)
            .expect("Content-Type", /json/);
    });

    it("Should call launch on registered microservices", async () => {
        const mockMicroservice = new MockMicroservice();
        const mockMicroservice1 = new MockMicroservice();
        appInstance.addMicroservice("mock", mockMicroservice);
        appInstance.addMicroservice("mock1", mockMicroservice1);
        await appInstance.start();
        expect(mockMicroservice.launch_called).toBeTruthy();
        expect(mockMicroservice1.launch_called).toBeTruthy();
    });

    it("should register microservice endpoints at provided path", async () => {
        const mockMicroservice = new MockMicroservice();
        const mockMicroservice1 = new MockMicroservice();
        appInstance.addMicroservice("mock", mockMicroservice);
        appInstance.addMicroservice("mock1", mockMicroservice1);
        await appInstance.start();
        await supertest(appInstance.getExpressApp())
            .get(`${baseURLPrefix}/mock`)
            .expect(200);
        await supertest(appInstance.getExpressApp())
            .get(`${baseURLPrefix}/mock1`)
            .expect(200);
        // sanity
        await supertest(appInstance.getExpressApp())
            .get(`${baseURLPrefix}/mock_some_other_route`)
            .expect(404);
    });

    it("should throw when microservice added at runtime", async () => {
        const mockMicroservice = new MockMicroservice();
        await appInstance.start();
        expect(() => {
            appInstance.addMicroservice("mock", mockMicroservice);
        }).toThrow();
    });

    it("should stop, add microservice, start", async () => {
        const mockMicroservice = new MockMicroservice();
        await appInstance.start();
        await appInstance.stop();
        expect(() => {
            appInstance.addMicroservice(
                "mock_run_stop_start",
                mockMicroservice
            );
        }).not.toThrow();
        await appInstance.start();
        await supertest(appInstance.getExpressApp())
            .get(`${baseURLPrefix}/mock_run_stop_start`)
            .expect(200);
    });

    it("should add custom middleware", async () => {
        const mockMiddleware = jest.fn((req, res) => res.sendStatus(200));
        appInstance.addCustomMiddleware("custom_middleware", mockMiddleware);
        await appInstance.start();
        await supertest(appInstance.getExpressApp())
            .get(`${baseURLPrefix}/custom_middleware`)
            .expect(200);
        expect(mockMiddleware).toHaveBeenCalled();
    });

    it("should properly support different type of routes and responses", async () => {
        const mockMicroservice = new MockMicroservice();
        appInstance.addMicroservice("mock", mockMicroservice);
        await appInstance.start();
        type Endpoint = [string, string, number];
        const endpoints: Endpoint[] = [
            ["get", "get_success_json", 200],
            ["get", "get_success_text", 200],
            ["get", "get_failure_500", 500],
            ["get", "get_failure_401", 401],
            ["post", "post_success_json", 200],
            ["post", "post_success_text", 200],
            ["post", "post_failure_500", 500],
            ["post", "post_failure_401", 401],
        ];

        for (const [method, endpoint, status] of endpoints) {
            await supertest(appInstance.getExpressApp())
                [method](`${baseURLPrefix}/mock/${endpoint}`)
                .expect(status);
        }
    });

    it("should add uuid to request", async () => {
        const mockMicroservice = new MockMicroservice();
        appInstance.addMicroservice("mock", mockMicroservice);
        await appInstance.start();

        await supertest(appInstance.getExpressApp())
            .get(`${baseURLPrefix}/mock/test_uuid`)
            .expect(200);
    });
});
