import { ILogger } from "../logging/i-logger";
import { IConfigProvider } from "./i-config-provider";
import { Router } from "express";

export interface IMicroservice {
    launch: (config: IConfigProvider, logger: ILogger) => Router;
}
