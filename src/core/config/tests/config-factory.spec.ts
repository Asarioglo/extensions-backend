// Test the config-factory.ts file:

// Path: src/core/config/tests/config-factory.spec.ts
import { ConfigFactory } from "../config-factory";
import { DevConfigProvider } from "../dev-config-provider";
import { TestConfigProvider } from "../test-config-provider";

describe("ConfigFactory", () => {
    it("should create a DevConfigProvider when environment is development", () => {
        const config = ConfigFactory.create("development");
        expect(config).toBeInstanceOf(DevConfigProvider);
    });

    it("should create a TestConfigProvider when environment is test", () => {
        const config = ConfigFactory.create("test");
        expect(config).toBeInstanceOf(TestConfigProvider);
    });

    it("should throw an error when environment is unknown", () => {
        expect(() => {
            ConfigFactory.create("unknown");
        }).toThrow(`Unknown environment: unknown`);
    });
});
