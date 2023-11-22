import { ILogger } from "../logging/i-logger";
import { IConfigProvider } from "./i-config-provider";
import { Router } from "express";
import { Application } from "express";

export interface IMicroservice {
    launch: (
        app: Application,
        config: IConfigProvider,
        logger: ILogger
    ) => Promise<Router>;
}
