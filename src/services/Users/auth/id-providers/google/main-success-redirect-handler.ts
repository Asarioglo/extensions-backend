import { IConfigProvider } from "../../../../../core/interfaces/i-config-provider";
import { ILogger } from "../../../../../core/logging/i-logger";
import IUserRepository from "../../../database/base/i-user-repository";
import { Request, Response } from "express";
import Tokens from "../../tokens";
import { IUser } from "../../../models/i-user";
import text from "../../../views/assets/text/en-us.json";

export const getMainSuccessRedirectHandler = (
    config: IConfigProvider,
    logger: ILogger,
    userRepo: IUserRepository
) => {
    return async (req: Request, res: Response) => {
        const secret = config.get("jwt_secret");
        if (!secret) {
            logger.error("Error getting jwt_secret from config");
            return res
                .status(500)
                .json({ message: "Error getting jwt_secret from config" });
        }
        if (!req.user) {
            logger.error("Error getting user from request");
            return res
                .status(500)
                .json({ message: "Error logging in, please try again later." });
        }

        const user = req.user as IUser;

        logger.debug("User received from google auth redirect");
        logger.debug(JSON.stringify(user));

        const { token, id } = Tokens.createToken(secret, user);

        try {
            await userRepo.update(user, { jwtId: id });
            const tplVars = {
                ...text.loginSuccessful,
                extensionId: config.get("extension_id"),
                auth_token: token,
            };
            res.render("users/pages/main-success.ejs", tplVars);
        } catch (err) {
            logger.error("Error saving jti", {
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
