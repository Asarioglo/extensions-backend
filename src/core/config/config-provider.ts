import { IConfigProvider } from "../interfaces/i-config-provider";

export type EnvVarMapping = [
    envvar: string,
    config_name: string,
    default_value?: any
];

export class ConfigProvider implements IConfigProvider {
    config = {};

    get(key: string, default_value: any = null): any {
        if (this.config[key] === undefined) {
            return default_value;
        }
        return this.config[key];
    }

    set(key: string, value: any) {
        this.config[key] = value;
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
}
