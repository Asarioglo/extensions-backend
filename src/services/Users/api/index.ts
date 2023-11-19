import { Router } from "express";
import GetUser from "./get-user";

export default function () {
    const router = Router();

    console.log("registering users routes");
    router.get("/me", GetUser);

    return router;
}
