import { DevConfigProvider } from "./dev-config-provider";
import { TestConfigProvider } from "./test-config-provider";

export class ConfigFactory {
    static create(environment: string) {
        switch (environment) {
            case "development":
                return new DevConfigProvider();
            case "test":
                return new TestConfigProvider();
            default:
                throw new Error(`Unknown environment: ${environment}`);
        }
    }
}
