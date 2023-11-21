import { ILogger } from "../logging/i-logger";
import { IConfigProvider } from "./i-config-provider";

export interface IMicroservice {
    launch: (config: IConfigProvider, logger: ILogger) => any;
}
