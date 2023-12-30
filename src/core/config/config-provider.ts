import { IConfigProvider } from "../interfaces/i-config-provider";
import Logger from "../logging/logger";

export type EnvVarMapping = [
    envvar: string,
    config_name: string,
    default_value?: string
];

export class ConfigProvider implements IConfigProvider {
    config = {};
    protected _logger = Logger.getLogger("config-provider");

    get(key: string, default_value: string = null): string {
        if (this.config[key] === undefined) {
            return default_value;
        }
        return this.config[key];
    }

    set(key: string, value: string) {
        this.config[key] = value;
        return this;
    }

    from_mappings(mappings: EnvVarMapping[]) {
        mappings.forEach(([envvar, config_name, default_value]) => {
            if (envvar in process.env) {
                this.set(config_name, process.env[envvar]);
            } else if (default_value !== undefined) {
                this.set(config_name, default_value);
            }
        });
    }

    clone(): ConfigProvider {
        const clone = new ConfigProvider();
        clone.config = { ...this.config };
        return clone;
    }
}
