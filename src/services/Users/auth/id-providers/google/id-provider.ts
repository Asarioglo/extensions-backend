import IIDProvider from "../../../models/i-id-provider";
// import { OAuth2Client } from "google-auth-library";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
// import { google } from "googleapis";
import IUserRepository from "../../../database/base/i-user-repository";
import { ILogger } from "../../../../../core/logging/i-logger";
import { Router } from "express";
import { IConfigProvider } from "../../../../../core/interfaces/i-config-provider";
import Logger from "../../../../../core/logging/logger";
import { getMainUserAuthCallback } from "./main-auth-cb";
import { OAuth2Client } from "google-auth-library";
import { getMainSuccessRedirectHandler } from "./main-success-redirect-handler";

export type GoogleCredentials = {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
};

export default class GoogleIDProvider implements IIDProvider {
    public name: string = "google";

    private _clientID: string;
    private _clientSecret: string;
    private _callbackURL: string;
    private _logger: ILogger;
    private _userRepo: IUserRepository;
    private _config: IConfigProvider;

    constructor(userRepo: IUserRepository, config: IConfigProvider) {
        this._logger = Logger.getLogger("google-auth-provider");
        this._userRepo = userRepo;
        this._config = config;

        this._clientID = config.get("google_client_id");
        this._clientSecret = config.get("google_client_secret");
        this._callbackURL = config.get("google_callback_url");
        if (!this._clientID || !this._clientSecret || !this._callbackURL) {
            this._logger.error(
                "Missing google_client_id, google_client_secret, or google_callback_url in config"
            );
            this._logger.info(
                `google_client_id: ${this._clientID}, google_client_secret: ${this._clientSecret}, google_callback_url: ${this._callbackURL}`
            );
            throw new Error(
                "Missing google_client_id, google_client_secret, or google_callback_url in config"
            );
        }
    }

    initialize(
        passportInstance: passport.PassportStatic,
        router: Router
    ): void {
        this.addLoginRoutes(router);
        this.addPassportStrategies(passportInstance);
    }

    addPassportStrategies(passportInstance: passport.PassportStatic) {
        passportInstance.use(
            "google_main",
            new GoogleStrategy(
                {
                    clientID: this._clientID,
                    clientSecret: this._clientSecret,
                    callbackURL: this._callbackURL,
                    passReqToCallback: true,
                },
                getMainUserAuthCallback(this._logger, this._userRepo)
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
            passport.authenticate("google_main", {
                failureRedirect: "/login",
            }),
            getMainSuccessRedirectHandler(
                this._config,
                this._logger,
                this._userRepo
            )
        );
    }

    async refreshToken(refreshToken: string) {
        const client = new OAuth2Client(
            this._clientID,
            this._clientSecret,
            this._callbackURL
        );
        client.setCredentials({ refresh_token: refreshToken });

        try {
            const { credentials } = await client.refreshAccessToken();
            const { access_token } = credentials;
            return access_token;
        } catch (e: unknown | Error) {
            this._logger.error("Could not refresh the access token", {
                meta: {
                    message: (e as Error).message || "no error message",
                },
            });
            return null;
        }
    }
}
