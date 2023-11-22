import { ConfigProvider, EnvVarMapping } from "./config-provider";

export class DevConfigProvider extends ConfigProvider {
    envvar_mappings: EnvVarMapping[] = [
        ["PORT", "port"],
        ["ROUTE_PREFIX", "route_prefix", ""],
        ["USERS_MONGO_URI", "users_mongo_uri"],
        ["USERS_MONGO_DB_NAME", "users_mongo_db_name", "test"],
    ];
    constructor() {
        super();
        this.from_mappings(this.envvar_mappings);
    }
}
