import { NextFunction, Request, Response } from "express";
import { IUser } from "./i-user";

export default interface IAuthenticator {
    authenticateUserRequest(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void>;

    setUserRepository(userRepo: unknown): void;

    createAuthToken(user: IUser): Promise<string>;

    createOneTimeToken(user: IUser): Promise<string>;
}
