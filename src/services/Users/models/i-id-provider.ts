import { Router } from "express";
import passport from "passport";

export default interface IIDProvider {
    name: string;

    initialize(passportInstance: passport.PassportStatic, router: Router): void;

    refreshToken(refreshToken: string): Promise<string>;
}
