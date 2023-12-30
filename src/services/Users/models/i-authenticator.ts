import { NextFunction, Request, Response } from "express";

export default interface IAuthenticator {
    authenticateUserRequest(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void>;

    setUserRepository(userRepo: unknown): void;
}
