import { Router } from "express";
import GetUser from "./get-user";
import IUserRepository from "../database/base/i-user-repository";
import { ILogger } from "../../../core/logging/i-logger";
import about from "./about";

export default function (userRepo: IUserRepository, logger: ILogger) {
    const router = Router();

    logger.debug("registering users routes");
    router.get("/me", GetUser);
    router.get("/about", about);

    return router;
}
