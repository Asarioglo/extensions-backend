import { Request, Response } from "express";
import text from "../../views/assets/text/en-us.json";
import { IConfigProvider } from "../../../../core/interfaces/i-config-provider";

export default (configProvider: IConfigProvider) => {
    return (req: Request, res: Response) => {
        // Need to clone the strings, because the template engine will
        // change the structure of the object to a callable function
        const baseUri = configProvider.get("route_prefix", "");
        const googleLoginUrl = `${baseUri}/google`;
        res.render("users/pages/login.ejs", { ...text.auth, googleLoginUrl });
    };
};
