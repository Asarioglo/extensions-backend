//------------ Local User Model ------------//
import passport from "passport";
import { IUser } from "../models/i-user";
import IUserRepository from "../database/base/i-user-repository";
import AbstractAuthProvider from "./abstract-auth-provider";

export default function (
    passport: passport.PassportStatic,
    userRepo: IUserRepository,
    providers: AbstractAuthProvider[]
) {
    passport.serializeUser(function (user: IUser, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id: string, done) {
        // logger.debug("Deserializing user: ", id);
        userRepo.findById(id, function (err: any, user: IUser | null) {
            if (err) {
                // logger.error("Error deserializing user with id: ", id);
                // logger.error({ errorObject: err });
            }
            done(err, user);
        });
    });

    // Make sure this is called after the registry providers
    // have been initialized
    providers.forEach((provider: AbstractAuthProvider) => {
        // logger.info("Adding passport strategy for provider: ", provider.name);
        provider.addPassportStrategy(passport);
    });
}
