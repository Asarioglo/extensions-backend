import { TestConfigProvider } from "../test-config-provider";

describe("TestConfigProvider", () => {
    let config = new TestConfigProvider();

    beforeEach(() => {
        process.env["PORT_TEST"] = "1234";
        process.env["ROUTE_PREFIX_TEST"] = "/test";
        config = new TestConfigProvider();
    });

    it("should initialize necessary dev configs", () => {
        expect(config.get("port")).toEqual("1234");
        expect(config.get("route_prefix")).toEqual("/test");
    });
});
