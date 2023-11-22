import { Router } from "express";
import GetUser from "./get-user";
import IUserRepository from "../database/base/i-user-repository";

export default function (userRepo: IUserRepository) {
    const router = Router();

    // will use later
    userRepo;

    console.log("registering users routes");
    router.get("/me", GetUser);

    return router;
}
