import { IConfigProvider } from "../../../../../core/interfaces/i-config-provider";
import { ILogger } from "../../../../../core/logging/i-logger";
import { Request, Response } from "express";
import { IUser } from "../../../models/i-user";
import text from "../../../views/assets/text/en-us.json";
import IAuthenticator from "../../../models/i-authenticator";

export const getMainSuccessRedirectHandler = (
    config: IConfigProvider,
    logger: ILogger,
    authenticator: IAuthenticator
) => {
    return async (req: Request, res: Response) => {
        if (!req.user) {
            logger.error("Error getting user from request");
            return res
                .status(500)
                .json({ message: "Error logging in, please try again later." });
        }

        const user = req.user as IUser;

        logger.debug("User received from google auth redirect");
        logger.debug(JSON.stringify(user));

        try {
            const token = authenticator.createAuthToken(user);
            const tplVars = {
                ...text.loginSuccessful,
                extensionId: config.get("extension_id"),
                auth_token: token,
            };
            res.render("users/pages/main-success.ejs", tplVars);
        } catch (err) {
            logger.error("Creating auth token", {
                meta: {
                    errorObject: err,
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                uuid: (req as any).uuid || "",
            });
            // TODO: Add error page
            return res.status(500).json({ message: "Error saving jti." });
        }
    };
};
