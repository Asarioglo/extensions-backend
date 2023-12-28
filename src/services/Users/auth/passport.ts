//------------ Local User Model ------------//
import passport from "passport";
import { IUser } from "../models/i-user";
import IUserRepository from "../database/base/i-user-repository";
import AbstractIDProvider from "./abstract-id-provider";
import Logger from "../../../core/logging/logger";
import { Router } from "express";

type SerializeDoneFn = (err: Error | null, id?: string) => void;
type DeserializeDoneFn = (err: Error | null, user?: IUser | null) => void;

export default function (
    userRepo: IUserRepository,
    router: Router,
    providers: AbstractIDProvider[],
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

    // Make sure this is called after the registry providers
    // have been initialized
    providers.forEach((provider: AbstractIDProvider) => {
        // logger.info("Adding passport strategy for provider: ", provider.name);
        provider.addPassportStrategies(target_passport, router);
    });
}
