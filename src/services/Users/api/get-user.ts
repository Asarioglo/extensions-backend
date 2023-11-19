import { Request, Response } from "express";

function getUser(req: Request, res: Response) {
    res.send(process.env.TEST_PROP);
}

export default getUser;
