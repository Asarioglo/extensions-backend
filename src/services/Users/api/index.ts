import { Router } from "express";
import GetUser from "./get-user";
import IUserRepository from "../database/base/i-user-repository";
import { ILogger } from "../../../core/logging/i-logger";

export default function (userRepo: IUserRepository, logger: ILogger) {
    const router = Router();

    // will use later
    userRepo;

    logger.debug("registering users routes");
    router.get("/me", GetUser);

    return router;
}
