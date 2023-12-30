import { Router } from "express";
import IIDProvider from "./i-id-provider";
import passport from "passport";

export default interface IProviderRegistry {
    registerProvider(provider: IIDProvider): void;
    getProviders(): IIDProvider[];
    getProviderByName(providerName: string): IIDProvider | null;
    initialize(passportInstance: passport.PassportStatic, router: Router): void;
}
