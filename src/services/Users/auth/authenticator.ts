import { Router, Response, NextFunction } from "express";
import { RequestWithUUID } from "../../../core/interfaces/request-with-uuid";
import IAuthenticator from "../models/i-authenticator";
import AbstractIDProvider from "./abstract-id-provider";
import passport from "passport";
import IUserRepository from "../database/base/i-user-repository";
import { initIdProviders } from "./id-providers";
import { IConfigProvider } from "../../../core/interfaces/i-config-provider";
import { ILogger } from "../../../core/logging/i-logger";
import Logger from "../../../core/logging/logger";
import Tokens, { TokenError } from "./tokens";
import { IUser } from "../models/i-user";
import Text from "../views/assets/text/en-us.json";
import { error } from "winston";

const errorText = Text.errors;

export class Authenticator implements IAuthenticator {
    private _providers: AbstractIDProvider[] = [];
    private _userRepo: IUserRepository;
    private _configProvider: IConfigProvider;
    private _jwtSecret: string;
    private _logger: ILogger;
    private _tokenLifetime: number = 60 * 60; // 1 hour

    constructor(
        configProvider: IConfigProvider,
        router: Router,
        userRepo: IUserRepository,
        passport?: passport.PassportStatic
    ) {
        this._logger = Logger.getLogger("users/authenticator");
        this._userRepo = userRepo;
        this._configProvider = configProvider;
        const secret = configProvider.get("jwt_secret", null);
        if (!secret) {
            this._logger.error("No jwt secret found in config");
            throw new Error("No jwt secret found in config.");
        }
        this._jwtSecret = secret;

        const tokenLifetimeStr = configProvider.get("jwt_lifetime", null);
        if (tokenLifetimeStr !== null) {
            const tokenLifetime = parseInt(tokenLifetimeStr);

            if (isNaN(tokenLifetime)) {
                this._logger.error(
                    `Invalid token lifetime provided in config ${tokenLifetime}. Must be an integer. Resetting to default ${this._tokenLifetime} seconds.`
                );
            } else {
                this._tokenLifetime = tokenLifetime;
            }
        }

        this._initProviders(router, passport);
    }

    private _initProviders(router: Router, passport?: passport.PassportStatic) {
        this._providers = initIdProviders(
            this._configProvider,
            router,
            this._userRepo,
            passport
        );
    }

    /**
     * To avoid handling this error multiple times - tada!
     */
    private async _getUserByToken(userId: string) {
        const user = await this._userRepo.findById(userId);
        if (!user) {
            throw new TokenError(
                Tokens.ErrorType.InvalidToken,
                null,
                errorText.invalidToken,
                "User specified in token not found in db"
            );
        }
        return user;
    }

    private async _refreshToken(user: IUser): Promise<string> {
        const { newProviderToken, newJWT, newJWTId } =
            await Tokens.refreshProviderToken(
                user,
                this._providers,
                this._jwtSecret,
                this._tokenLifetime,
                this._logger
            );
        await this._userRepo.update(user, {
            token: newProviderToken,
            jwtId: newJWTId,
            lastActive: new Date(),
        });
        return newJWT;
    }

    private async _verifyOrRefresh(
        tkn: string
    ): Promise<[IUser, string | null]> {
        try {
            const decodedValidated = Tokens.validateToken(
                tkn,
                this._jwtSecret,
                this._logger
            );
            const user = await this._getUserByToken(decodedValidated.userId);
            Tokens.additionalValidation(decodedValidated, user);
            // TODO: might be too many writes here
            this._userRepo.update(user, {
                lastActive: new Date(),
            });
            return [user, null];
        } catch (error) {
            if (
                error instanceof TokenError &&
                error.type === Tokens.ErrorType.ExpiredToken
            ) {
                const decoded = Tokens.decodeToken(tkn);
                if (!decoded || !decoded.userId) {
                    throw new TokenError(
                        Tokens.ErrorType.InvalidToken,
                        null,
                        errorText.invalidToken,
                        "Token could not be decoded or user ID could not be extracted from token"
                    );
                }
                const user = await this._getUserByToken(decoded.userId);
                const newToken = await this._refreshToken(user);
                return [user, newToken];
            } else {
                throw error;
            }
        }
    }

    private async _resetUserCredentials(user: IUser) {
        await this._userRepo.update(user, {
            jwtId: null,
            token: null,
            refreshToken: null,
        });
    }

    async authenticateUserRequest(
        req: RequestWithUUID,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        // get token from headers
        const token = req.headers.authorization
            ? req.headers.authorization.split(" ")[1]
            : null;
        // console.log("token received in request \n", token);

        // if there's no token, return 401
        if (!token) {
            throw new TokenError(
                Tokens.ErrorType.NoToken,
                null,
                errorText.noToken,
                "No jwt token provided, can't authenticate request"
            );
        }
        try {
            const [user, newToken] = await this._verifyOrRefresh(token);
            if (newToken) {
                res.setHeader("Authorization", `Bearer ${newToken}`);
            }
            req.user = user;
            return next();
        } catch (e: unknown) {
            if (e instanceof TokenError) {
                if (e.user) {
                    try {
                        await this._resetUserCredentials(e.user);
                    } catch (credentialsResetError) {
                        // Let the users see the original reason for credentials reset
                        // No need to terminate here
                        this._logger.error("Error resetting user credentials", {
                            uuid: req.uuid,
                            meta: {
                                errorObject: credentialsResetError.message,
                            },
                        });
                    }
                }
                this._logger.error(e.additionalInfo, {
                    uuid: req.uuid,
                });
                res.status(401).json({ message: e.message });
                return;
            } else {
                this._logger.error((e as Error).message, {
                    uuid: req.uuid,
                    meta: {
                        stack: (e as Error).stack,
                    },
                });
                this._logger.error(
                    "Unhandled error validating token. See message above.",
                    {
                        meta: {
                            errorObject: e,
                        },
                        uuid: req.uuid,
                    }
                );
                res.status(500).json({
                    message: errorText.authBugLogoutAndLoginAgain,
                });
                return;
            }
        }
    }
}
