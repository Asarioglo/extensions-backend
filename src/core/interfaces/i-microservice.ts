import { IConfigProvider } from "./i-config-provider";
import { Router } from "express";
import { Application } from "express";

export interface IMicroservice {
    launch: (app: Application, config: IConfigProvider) => Promise<Router>;
}
