import { Request, Response } from "express";
import text from "../views/assets/text/en-us.json";

export default (req: Request, res: Response) => {
    // Need to clone the strings, because the template engine will
    // change the structure of the object to a callable function
    res.render("users/pages/login.ejs", { ...text.auth });
};
