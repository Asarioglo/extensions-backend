import AbstractAuthProvider from "../abstract-auth-provider.js";
// import { OAuth2Client } from "google-auth-library";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
// import { google } from "googleapis";
import IUserRepository from "../../database/base/i-user-repository.js";
import { ILogger } from "../../../../core/logging/i-logger.js";
import { Router } from "express";

export type GoogleCredentials = {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
};

export default class GoogleProvider extends AbstractAuthProvider {
    private _clientID: string;
    private _clientSecret: string;
    private _callbackURL: string;
    private _logger: ILogger;
    private _userRepo: IUserRepository;

    constructor(
        name: string,
        credentials: GoogleCredentials,
        logger: ILogger,
        userRepo: IUserRepository
    ) {
        super(name);
        this._clientID = credentials.clientID;
        this._clientSecret = credentials.clientSecret;
        this._callbackURL = credentials.callbackURL;
        this._logger = logger;
        this._userRepo = userRepo;
        this.name = "google";
    }

    addPassportStrategy(passport: passport.PassportStatic) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: this._clientID,
                    clientSecret: this._clientSecret,
                    callbackURL: this._callbackURL,
                    passReqToCallback: true,
                },
                async function (req, accessToken, refreshToken, profile, done) {
                    try {
                        const email = profile.emails?.[0].value;
                        if (!email) {
                            this._logger.error("Email not found in profile", {
                                uuid: "uuid" in req ? req.uuid : "",
                            });
                            throw new Error("Email not found in profile");
                        }
                        const user = await this._userRepo.findOrCreate(
                            profile.id,
                            "google",
                            email,
                            accessToken,
                            refreshToken,
                            profile.displayName
                        );
                        if (!user) {
                            this._logger.error(
                                "Couldn't create user. Object returned form findOrCreate is undefined",
                                { uuid: "uuid" in req ? req.uuid : "" }
                            );
                            throw new Error("Couldn't create user");
                        }
                        done(null, user);
                    } catch (err) {
                        this._logger.error("Error creating user: ", {
                            meta: {
                                errorObject: err,
                            },
                            uuid: "uuid" in req ? req.uuid : "",
                        });
                        return done(err);
                    }
                }
            )
        );
    }

    addLoginRoutes(router: Router) {
        router;
        return;
        // router.get(
        //     "/google",
        //     passport.authenticate("google", {
        //         scope: [
        //             "profile",
        //             "email",
        //             "openid",
        //             "https://www.googleapis.com/auth/gmail.send",
        //         ],
        //         accessType: "offline",
        //         prompt: "consent",
        //     })
        // );

        // router.get(
        //     "/sub/google",
        //     TokenLogic.authenticateWithCode,
        //     passport.authenticate("google", {
        //         scope: [
        //             "profile",
        //             "email",
        //             "openid",
        //             "https://www.googleapis.com/auth/gmail.send",
        //         ],
        //         accessType: "offline",
        //         prompt: "consent",
        //         state: "sub_user",
        //     })
        // );

        // router.get(
        //     "/google/callback",
        //     passport.authenticate("google", { failureRedirect: "/login" }),
        //     GoogleProvider._handleLogin
        // );
    }

    async refreshToken(refreshToken: string) {
        refreshToken;
        return "";
        // const client = new OAuth2Client(
        //     this._clientID,
        //     this._clientSecret,
        //     this._callbackURL
        // );

        // const { tokens } = await client.refreshToken(refreshToken);

        // return tokens.access_token;
    }
}
