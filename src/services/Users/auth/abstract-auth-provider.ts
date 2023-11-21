import passport from "passport";
import { Router } from "express";

export default abstract class AbstractAuthProvider {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    // eslint-disable-next-line no-unused-vars
    abstract addPassportStrategy(passport: passport.PassportStatic): void;

    abstract addLoginRoutes(router: Router): void;

    abstract refreshToken(refreshToken: string): Promise<string>;

    getName(): string {
        return this.name;
    }
}
