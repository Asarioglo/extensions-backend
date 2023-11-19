import { ConfigProvider, EnvVarMapping } from "./config-provider";

export class TestConfigProvider extends ConfigProvider {
    envvar_mappings: EnvVarMapping[] = [
        ["PORT_TEST", "port"],
        ["ROUTE_PREFIX_TEST", "route_prefix", ""],
        ["TEST_JWT_SECRET", "jwt_secret"],
    ];
    constructor() {
        super();
        this.from_mappings(this.envvar_mappings);
    }
}
