import { Router } from "express";
import passport from "passport";
import IAuthenticator from "./i-authenticator";

export default interface IIDProvider {
    name: string;

    initialize(
        passportInstance: passport.PassportStatic,
        router: Router,
        authenticator: IAuthenticator
    ): void;

    refreshToken(refreshToken: string): Promise<string>;
}
