import { Router } from "express";
import GoogleIDProvider from "./google-id-provider";
import IUserRepository from "../../database/base/i-user-repository";
import passport from "passport";
import { IConfigProvider } from "../../../../core/interfaces/i-config-provider";

export const initIdProviders = (
    configProvider: IConfigProvider,
    router: Router,
    userRepo: IUserRepository,
    passport?: passport.PassportStatic
) => {
    const providers = [];
    providers.push(new GoogleIDProvider());
    return providers;
};
