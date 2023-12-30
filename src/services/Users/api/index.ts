import { Router } from "express";
import GetUser from "./get-user";
import IUserRepository from "../database/base/i-user-repository";
import about from "./about";
import Logger from "../../../core/logging/logger";
import IAuthenticator from "../models/i-authenticator";
import { IConfigProvider } from "../../../core/interfaces/i-config-provider";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const start = (
    config: IConfigProvider,
    userRepo: IUserRepository,
    authenticator: IAuthenticator
) => {
    const _logger = Logger.getLogger("users-api");
    _logger.debug("registering users routes");
    const apiRouter = Router();

    apiRouter.get("/me", GetUser);
    apiRouter.get("/about", about);

    return apiRouter;
};
