import { ConfigProvider, EnvVarMapping } from "./config-provider";

export class DevConfigProvider extends ConfigProvider {
    envvar_mappings: EnvVarMapping[] = [
        ["PORT", "port"],
        ["ROUTE_PREFIX", "route_prefix", ""],
        ["USERS_MONGO_URI", "users_mongo_uri"],
        ["USERS_MONGO_DB_NAME", "users_mongo_db_name", "test"],
        ["JWT_SECRET", "jwt_secret"],
        ["GOOGLE_CLIENT_ID", "google_client_id"],
        ["GOOGLE_CLIENT_SECRET", "google_client_secret"],
        ["GOOGLE_CALLBACK", "google_callback_url"],
    ];
    constructor() {
        super();
        this.from_mappings(this.envvar_mappings);
        this._logger.debug("Loaded config from env vars");
        this._logger.debug(JSON.stringify(this.config, null, 2));
    }
}
