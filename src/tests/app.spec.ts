import App from "../App";
import { ConfigFactory } from "../core/config/config-factory";
import { ConfigProvider } from "../core/config/config-provider";
import { MockMicroservice } from "../testing/mock-microservice";
import supertest from "supertest";

describe("App", () => {
    let appInstance: App;
    let configProvider = ConfigFactory.create("test");
    let base_uri_prefix = configProvider.get("route_prefix", "");

    beforeEach(async () => {
        appInstance = new App(configProvider);
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
        await appInstance.init();
        expect(appInstance.getExpressApp()).toBeDefined();
    });

    it("Should handle 404 routes", async () => {
        await appInstance.init();
        await supertest(appInstance.getExpressApp())
            .get("/nonexistent-route")
            .set("Accept", "application/json")
            .expect(404)
            .expect("Content-Type", /json/);
        await supertest(appInstance.getExpressApp())
            .get(`${base_uri_prefix}}/nonexistent-route`)
            .set("Accept", "application/json")
            .expect(404)
            .expect("Content-Type", /json/);
    });

    it("Should call launch on registered microservices", async () => {
        const mockMicroservice = new MockMicroservice();
        const mockMicroservice1 = new MockMicroservice();
        appInstance.addMicroservice("mock", mockMicroservice);
        appInstance.addMicroservice("mock1", mockMicroservice1);
        await appInstance.init();
        expect(mockMicroservice.launch_called).toBeTruthy();
        expect(mockMicroservice1.launch_called).toBeTruthy();
    });

    it("should register microservice endpoints at provided path", async () => {
        const mockMicroservice = new MockMicroservice();
        const mockMicroservice1 = new MockMicroservice();
        appInstance.addMicroservice("mock", mockMicroservice);
        appInstance.addMicroservice("mock1", mockMicroservice1);
        await appInstance.init();
        await supertest(appInstance.getExpressApp())
            .get(`${base_uri_prefix}/mock`)
            .expect(200);
        await supertest(appInstance.getExpressApp())
            .get(`${base_uri_prefix}/mock1`)
            .expect(200);
        // sanity
        await supertest(appInstance.getExpressApp())
            .get(`${base_uri_prefix}/mock_some_other_route`)
            .expect(404);
    });

    it("should properly support different type of routes and responses", async () => {
        const mockMicroservice = new MockMicroservice();
        appInstance.addMicroservice("mock", mockMicroservice);
        await appInstance.init();
        let endpoints = [
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
                [method](`${base_uri_prefix}/mock/${endpoint}`)
                .expect(status);
        }
    });
});
