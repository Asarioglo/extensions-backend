import { Router, Response, NextFunction } from "express";
import { RequestWithUUID } from "../../../core/interfaces/request-with-uuid";
import IAuthenticator from "../models/i-authenticator";
import passport from "passport";
import IUserRepository from "../database/base/i-user-repository";
import { IConfigProvider } from "../../../core/interfaces/i-config-provider";
import { ILogger } from "../../../core/logging/i-logger";
import Logger from "../../../core/logging/logger";
import Tokens, { TokenError, TokenPayload } from "./tokens";
import { IUser } from "../models/i-user";
import Text from "../views/assets/text/en-us.json";
import IProviderRegistry from "../models/i-provider-registry";

const errorText = Text.errors;

export default class Authenticator implements IAuthenticator {
    private _userRepo: IUserRepository;
    private _configProvider: IConfigProvider;
    private _jwtSecret: string;
    private _logger: ILogger;
    private _tokenLifetime: number = 60 * 60; // 1 hour
    private _oneTimeTokenLifetime: number = 60 * 2; // 2 minutes
    private _providerRegistry: IProviderRegistry;

    constructor(
        providerRegistry: IProviderRegistry,
        configProvider: IConfigProvider,
        router: Router,
        userRepo: IUserRepository,
        passportInstance: passport.PassportStatic
    ) {
        this._logger = Logger.getLogger("users/authenticator");
        this._userRepo = userRepo;
        this._configProvider = configProvider;
        this._providerRegistry = providerRegistry;

        const secret = this._configProvider.get("jwt_secret", null);
        if (!secret) {
            this._logger.error("No jwt secret found in config");
            throw new Error("No jwt secret found in config.");
        }
        this._jwtSecret = secret;

        const tokenLifetimeStr = this._configProvider.get("jwt_lifetime", null);
        if (tokenLifetimeStr !== null) {
            const tokenLifetime = parseInt(tokenLifetimeStr);

            if (isNaN(tokenLifetime) || tokenLifetime < 0) {
                this._logger.error(
                    `Invalid token lifetime provided in config ${tokenLifetime}. Must be an integer. Resetting to default ${this._tokenLifetime} seconds.`
                );
            } else {
                this._tokenLifetime = tokenLifetime;
            }
        }

        this._providerRegistry.initialize(passportInstance, router, this);
    }

    getTokenLifetime(): number {
        return this._tokenLifetime;
    }

    setUserRepository(userRepo: IUserRepository): void {
        this._userRepo = userRepo;
    }

    setProviderRegistry(providerRegistry: IProviderRegistry): void {
        this._providerRegistry = providerRegistry;
    }

    /**
     * Attempts to refresh the provider token and generate a new
     * JWT token.
     * If successful - updates the user in database and returns the new JWT.
     * If not successful - resets the user in database and throws an error.
     */
    private async _refreshToken(
        user: IUser
    ): Promise<{ newJWT: string; newUser: IUser }> {
        let newProviderToken: string = null;
        let newJWT: string = null;
        let newJWTId: string = null;
        try {
            const updated = await Tokens.refreshToken(
                user,
                this._providerRegistry,
                this._jwtSecret,
                this._tokenLifetime,
                this._logger
            );
            newProviderToken = updated.newProviderToken;
            newJWT = updated.newJWT;
            newJWTId = updated.newJWTId;
        } catch (e: unknown) {
            await this._userRepo.update(user, {
                refreshToken: null,
                token: null,
                jwtId: null,
                lastActive: new Date(),
            });
            throw e;
        }
        if (!newProviderToken || !newJWT || !newJWTId) {
            throw new TokenError(
                Tokens.ErrorType.RefreshError,
                user,
                errorText.couldNotRefreshToken,
                "Provider returned no new token"
            );
        }
        const newUser = await this._userRepo.update(user, {
            token: newProviderToken,
            jwtId: newJWTId,
            lastActive: new Date(),
        });
        return { newJWT, newUser };
    }

    /**
     * Verifies the token and refreshes it if it's expired. If the verification fails
     * for any other reason, resets the user credentials and throws an error.
     * If the token is not expired but also not valid, detect a potential security threat.
     */
    private async _verifyOrRefresh(
        tkn: string,
        user: IUser
    ): Promise<{ newJWT: string; newUser: IUser } | null> {
        try {
            Tokens.validateToken(tkn, this._jwtSecret, this._logger);
            // TODO: might be too many writes here
            this._userRepo.update(user, {
                lastActive: new Date(),
            });
            return null; // No new token
        } catch (error) {
            if (
                error instanceof TokenError &&
                error.type === Tokens.ErrorType.ExpiredToken
            ) {
                const payload = Tokens.decodeToken(tkn);
                if (payload.oneTimeToken) {
                    throw new TokenError(
                        Tokens.ErrorType.InvalidToken,
                        user,
                        errorText.oneTimeTokenExpired,
                        "One time token expired"
                    );
                }
                return await this._refreshToken(user);
            } else {
                // Should probably check for network errors, etc. But for now this blanket will
                // keep us warm.
                this._logger.error(
                    "Token not expired, but invalid. Could be an attempt to tinker with the token.",
                    {
                        type: "SECURITY",
                    }
                );
                throw error;
            }
        }
    }

    /**
     * Because I like to delegate
     */
    private async _resetUserCredentials(user: IUser) {
        await this._userRepo.update(user, {
            jwtId: null,
            token: null,
            refreshToken: null,
        });
    }

    /**
     * Checks the request for an appropriate header, parses the header, and
     * returns the token if the header is valid and token can be retrieved.
     * Throws otherwise.
     */
    private _getTokenFromRequest(req: RequestWithUUID): string {
        let token: string = null;
        if (req.headers.authorization) {
            const parts = req.headers.authorization.split(" ");
            if (parts.length === 2) {
                if (parts[1] !== null && parts[1].length > 0) {
                    token = parts[1];
                }
            }
        } else if (req.query && req.query.ot_code) {
            if (typeof req.query.ot_code === "string") {
                token = req.query.ot_code as string;
            }
        }
        // TODO: Maybe some day
        // else if (req.cookies) {
        //     token = req.cookies.jwt;
        // }

        if (!token) {
            throw new TokenError(
                Tokens.ErrorType.NoToken,
                null,
                errorText.noToken,
                "No jwt token provided, can't authenticate request"
            );
        }
        return token;
    }

    /**
     * Checks that the user specified in the token exists in the database
     * and that the token jti matches the user's jti.
     * If it doesn't match, that means that a new token was issued since this
     * one was created and this request should be rejected.
     */
    private async _testJTIandGetUser(payload: TokenPayload): Promise<IUser> {
        const user = await this._userRepo.findById(payload.userId);
        if (!user) {
            throw new TokenError(
                Tokens.ErrorType.InvalidToken,
                null,
                errorText.invalidToken,
                "User specified in token not found in db"
            );
        }
        if (user.jwtId !== payload.jti) {
            throw new TokenError(
                Tokens.ErrorType.InvalidToken,
                user,
                errorText.anotherTokenIssued,
                "Token jti does not match user's jti"
            );
        }
        return user;
    }

    async createAuthToken(user: IUser): Promise<string> {
        const { token, id } = Tokens.createToken(
            this._jwtSecret,
            user,
            this._tokenLifetime
        );
        await this._userRepo.update(user, { jwtId: id });
        return token;
    }

    /**
     * Generates a short lived code which can be used to authenticate a request
     * which is coming from a popup, such as accoutn management, auxilary user auth,
     * because the popup and the extension don't share a domain.
     * @param {int} _lifetime - Used for testing
     */
    async createOneTimeToken(user: IUser, _lifetime?: number): Promise<string> {
        // Later we will store the token in the database and check that
        // it's used only once. For now, we just check that it's valid.
        const { token } = Tokens.createToken(
            this._jwtSecret,
            user,
            _lifetime !== undefined ? _lifetime : this._oneTimeTokenLifetime,
            true,
            { oneTimeToken: true }
        );
        return token;
    }

    async authenticateUserRequest(
        req: RequestWithUUID,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Will throw appropriately if token is empty or invalid
            const token = this._getTokenFromRequest(req);
            // Tests that it's a valid JWT token with correct payload
            const decoded = Tokens.decodeToken(token);
            Tokens.testTokenPayload(decoded);
            // Will throw if a new token was issued since this one was created
            let user = await this._testJTIandGetUser(decoded);
            // Will throw if token can't be refreshed and will reset the user.
            const updated = await this._verifyOrRefresh(token, user);
            if (updated) {
                res.setHeader("Authorization", `Bearer ${updated.newJWT}`);
                user = updated.newUser;
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
