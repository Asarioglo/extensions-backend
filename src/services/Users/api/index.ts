import { Router } from "express";
import GetUser from "./get-user";
import IUserRepository from "../database/base/i-user-repository";
import about from "./about";
import login from "./login";
import Logger from "../../../core/logging/logger";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (userRepo: IUserRepository) {
    const router = Router();

    const _logger = Logger.getLogger("users-api");
    _logger.debug("registering users routes");

    // AUTH
    router.get("/login", login);

    router.get("/me", GetUser);
    router.get("/about", about);

    return router;
}
