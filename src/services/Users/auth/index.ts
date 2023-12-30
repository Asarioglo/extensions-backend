import { Application, Router } from "express";
import { IConfigProvider } from "../../../core/interfaces/i-config-provider";
import IUserRepository from "../database/base/i-user-repository";
import passport from "passport";
import Logger from "../../../core/logging/logger";
import Authenticator from "./authenticator";
import configurePassport from "./configure-passport";
import { initIdProviders } from "./id-providers";
import loginController from "./controllers/login";

export const start = (
    configProvider: IConfigProvider,
    userRepo: IUserRepository,
    app: Application
): { authenticator: Authenticator; authRouter: Router } => {
    const logger = Logger.getLogger("users/authenticator");
    logger.debug("starting users authenticator");
    const authRouter = Router();

    app.use(passport.initialize());
    app.use(passport.session());
    configurePassport(userRepo, passport);

    const providerRegistry = initIdProviders(configProvider, userRepo);

    const authenticator = new Authenticator(
        providerRegistry,
        configProvider,
        authRouter,
        userRepo,
        passport
    );

    authRouter.get("/login", loginController(configProvider));

    return { authenticator, authRouter };
};
