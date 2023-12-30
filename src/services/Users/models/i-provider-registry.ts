import { Router } from "express";
import IIDProvider from "./i-id-provider";
import passport from "passport";
import IAuthenticator from "./i-authenticator";

export default interface IProviderRegistry {
    registerProvider(provider: IIDProvider): void;
    getProviders(): IIDProvider[];
    getProviderByName(providerName: string): IIDProvider | null;
    initialize(
        passportInstance: passport.PassportStatic,
        router: Router,
        authenticator: IAuthenticator
    ): void;
}
