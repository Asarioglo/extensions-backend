import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import IUserRepository from "../database/base/i-user-repository";

export default interface IAuthenticator {
    initialize(
        router: Router,
        userRepo: IUserRepository,
        passport?: passport.PassportStatic
    ): void;

    authenticateUserRequest(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void>;
}
