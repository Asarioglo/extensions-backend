import { Request } from "express";
import { DoneCallback, Profile } from "passport";
import { ILogger } from "../../../../../core/logging/i-logger";
import IUserRepository from "../../../database/base/i-user-repository";

export const getMainUserAuthCallback =
    (logger: ILogger, userRepo: IUserRepository) =>
    async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: DoneCallback
    ): Promise<void> => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                logger.error("Email not found in profile", {
                    uuid: "uuid" in req ? req.uuid : "",
                });
                throw new Error("Email not found in profile");
            }
            const user = await userRepo.findOrCreate({
                providerId: profile.id,
                provider: "google",
                email,
                token: accessToken,
                refreshToken,
                name: profile.displayName,
            });
            if (!user) {
                logger.error(
                    "Couldn't create user. Object returned form findOrCreate is undefined",
                    { uuid: "uuid" in req ? req.uuid : "" }
                );
                throw new Error("Couldn't create user");
            }
            done(null, user);
        } catch (err) {
            logger.error("Error creating user: ", {
                meta: {
                    errorObject: err,
                },
                uuid: "uuid" in req ? req.uuid : "",
            });
            return done(err);
        }
    };
