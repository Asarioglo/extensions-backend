import { ConfigProvider, EnvVarMapping } from "./config-provider";

export class DevConfigProvider extends ConfigProvider {
    envvar_mappings: EnvVarMapping[] = [
        ["PORT_DEV", "port"],
        ["ROUTE_PREFIX_DEV", "route_prefix", ""],
    ];
    constructor() {
        super();
        this.from_mappings(this.envvar_mappings);
    }
}
