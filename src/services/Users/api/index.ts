import { Router } from "express";
import GetUser from "./get-user";
import IUserRepository from "../database/base/i-user-repository";
import about from "./about";
import Logger from "../../../core/logging/logger";

export default function (userRepo: IUserRepository) {
    const router = Router();

    const _logger = Logger.getLogger("users-api");
    _logger.debug("registering users routes");
    router.get("/me", GetUser);
    router.get("/about", about);

    return router;
}
