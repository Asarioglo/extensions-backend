import { DevConfigProvider } from "../dev-config-provider";

describe("DevConfigProvider", () => {
    let config = new DevConfigProvider();

    beforeEach(() => {
        process.env["PORT_DEV"] = "1234";
        process.env["ROUTE_PREFIX_DEV"] = "/dev";
        config = new DevConfigProvider();
    });

    it("should initialize necessary dev configs", () => {
        expect(config.get("port")).toEqual("1234");
        expect(config.get("route_prefix")).toEqual("/dev");
    });
});
