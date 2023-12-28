import AbstractIDProvider from "../abstract-id-provider.js";
// import { OAuth2Client } from "google-auth-library";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
// import { google } from "googleapis";
import IUserRepository from "../../database/base/i-user-repository.js";
import { ILogger } from "../../../../core/logging/i-logger.js";
import { Router } from "express";
import { Request, Response } from "express";
import Tokens from "../tokens.js";
import { IConfigProvider } from "../../../../core/interfaces/i-config-provider.js";
import Logger from "../../../../core/logging/logger.js";
import { IUser } from "../../models/i-user.js";

export type GoogleCredentials = {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
};

export default class GoogleIDProvider extends AbstractIDProvider {
    private _clientID: string;
    private _clientSecret: string;
    private _callbackURL: string;
    private _logger: ILogger;
    private _userRepo: IUserRepository;
    private _config: IConfigProvider;

    constructor(
        name: string,
        credentials: GoogleCredentials,
        userRepo: IUserRepository,
        config: IConfigProvider
    ) {
        super(name);
        this._clientID = credentials.clientID;
        this._clientSecret = credentials.clientSecret;
        this._callbackURL = credentials.callbackURL;
        this._logger = Logger.getLogger("google-auth-provider");
        this._userRepo = userRepo;
        this._config = config;
        this.name = "google";
    }

    addPassportStrategies(passport: passport.PassportStatic, router: Router) {
        this.addLoginRoutes(router);
        passport.use(
            "google_main",
            new GoogleStrategy(
                {
                    clientID: this._clientID,
                    clientSecret: this._clientSecret,
                    callbackURL: this._callbackURL,
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        const email = profile.emails?.[0].value;
                        if (!email) {
                            this._logger.error("Email not found in profile", {
                                uuid: "uuid" in req ? req.uuid : "",
                            });
                            throw new Error("Email not found in profile");
                        }
                        const user = await this._userRepo.findOrCreate({
                            id: profile.id,
                            provider: "google",
                            email,
                            token: accessToken,
                            refreshToken,
                            name: profile.displayName,
                        });
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
        router.get(
            "/google",
            passport.authenticate("google_main", {
                scope: [
                    "profile",
                    "email",
                    "openid",
                    "https://www.googleapis.com/auth/gmail.send",
                ],
                accessType: "offline",
                prompt: "consent",
            } as passport.AuthenticateOptions)
        );

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

        router.get(
            "/google/callback",
            passport.authenticate("google", { failureRedirect: "/login" }),
            this._handleLogin
        );
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

    async _handleLogin(req: Request, res: Response) {
        const secret = this._config.get("jwt_secret");
        if (!secret) {
            this._logger.error("Error getting jwt_secret from config");
            return res
                .status(500)
                .json({ message: "Error getting jwt_secret from config" });
        }
        if (!req.user) {
            this._logger.error("Error getting user from request");
            return res
                .status(500)
                .json({ message: "Error logging in, please try again later." });
        }

        const user = req.user as IUser;

        const { token, id } = Tokens.createToken(secret, user);
        const { state } = req.query;

        if (state === "sub_user") {
            res.render("auth/sub_success", {
                userId: user.id,
                email: user.email,
            });
        } else {
            // Save jti to database (add your own logic to save jti)
            try {
                await this._userRepo.update(user, { jwtId: id });
                res.render("auth/success", {
                    auth_token: token,
                });
            } catch (err) {
                this._logger.error("Error saving jti", {
                    meta: {
                        errorObject: err,
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    uuid: (req as any).uuid || "",
                });
                return res.status(500).json({ message: "Error saving jti." });
            }
        }
    }
}
