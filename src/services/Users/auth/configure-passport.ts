//------------ Local User Model ------------//
import passport from "passport";
import { IUser } from "../models/i-user";
import IUserRepository from "../database/base/i-user-repository";
import Logger from "../../../core/logging/logger";

type SerializeDoneFn = (err: Error | null, id?: string) => void;
type DeserializeDoneFn = (err: Error | null, user?: IUser | null) => void;

export default function (
    userRepo: IUserRepository,
    // to support injecting a mock passport for testing
    target_passport: passport.PassportStatic = passport
) {
    const logger = Logger.getLogger("config-passport");
    logger.debug("Configuring passport");
    target_passport.serializeUser<string>(
        (user: Express.User, done: SerializeDoneFn) => {
            if ("id" in user && typeof user.id === "string")
                done(null, user.id);
            else done(new Error("Invalid user object"));
        }
    );

    target_passport.deserializeUser((id: string, done: DeserializeDoneFn) => {
        // logger.debug("Deserializing user: ", id);
        userRepo.findById(id, function (err: Error | null, user: IUser | null) {
            if (err) {
                // logger.error("Error deserializing user with id: ", id);
                // logger.error({ errorObject: err });
            }
            done(err, user);
        });
    });
}
