import { IUser } from "../models/i-user";
import jwt from "jsonwebtoken";
import { ILogger } from "../../../core/logging/i-logger";
import Text from "../views/assets/text/en-us.json";
import IProviderRegistry from "../models/i-provider-registry";

const errorText = Text.errors;

export type TokenPayload = {
    userId: string;
    exp: number;
    jti: string;
};

export class TokenError extends Error {
    public type: Tokens.ErrorType;
    public user: IUser | null;
    public additionalInfo: string = "";

    constructor(
        type: Tokens.ErrorType,
        user: IUser | null,
        message: string,
        additionalInfo?: string
    ) {
        super(message);
        this.name = "TokenValidationError";
        this.type = type;
        this.user = user;
        if (additionalInfo) {
            this.additionalInfo = additionalInfo;
        }
    }
}

namespace Tokens {
    export enum ErrorType {
        OutdatedToken,
        ExpiredToken,
        InvalidToken,
        NoProvider,
        RefreshError,
        NoToken,
    }

    /**
     * Creates a JWT token which the user can use to authenticate with the API
     */
    export function createToken(
        secret: string,
        user: IUser,
        durationSeconds?: number,
        preserveJti: boolean = false
    ) {
        if (!user || !user.id) {
            throw new Error(`Invalid user provided to createToken ${user}`);
        }
        if (!durationSeconds) {
            durationSeconds = 60 * 60; // 1 hour
        }

        const tokenID = preserveJti
            ? user.jwtId
            : jwt.sign({ userId: user.id, salt: Math.random() }, secret);

        const payload: TokenPayload = {
            userId: user.id,
            exp: Math.floor(Date.now() / 1000) + durationSeconds,
            jti: tokenID,
        };
        const token = jwt.sign(JSON.parse(JSON.stringify(payload)), secret, {
            algorithm: "HS256",
        });

        // logger.info("Token created for user " + user.email, {
        //     meta: {
        //         userId: user.id,
        //     },
        // });

        return {
            token: token,
            id: payload.jti,
        };
    }

    /**
     * After a token has been decoded correctly and the user found, this function
     * checks whether a new token has been issues since the last time the user
     * logged in. If so, the token is outdated and the user needs to log in again.
     */
    export function additionalValidation(decoded: TokenPayload, user: IUser) {
        if (user.jwtId !== decoded.jti) {
            throw new TokenError(
                Tokens.ErrorType.OutdatedToken,
                user,
                "Token is no longer valid",
                "The jti of token does not match the jti of the user"
            );
        }
        return true;
    }

    /**
     * Only decodes the token, does not validate it. Be careful not to use this to
     * authenticate a user, as it does not check whether the token is valid.
     */
    export function decodeToken(token: string): TokenPayload {
        try {
            const decoded = jwt.decode(token) as TokenPayload;
            if (!decoded) {
                throw new TokenError(
                    Tokens.ErrorType.InvalidToken,
                    null,
                    errorText.invalidToken,
                    "Decoded object is null"
                );
            }
            return decoded;
        } catch (e: any /* eslint-disable-line */) {
            throw new TokenError(
                Tokens.ErrorType.InvalidToken,
                null,
                errorText.invalidToken,
                `Token could not be decoded: ${e.message}`
            );
        }
    }

    export function testTokenPayload(payload: TokenPayload) {
        if (!payload.userId || !payload.jti) {
            throw new TokenError(
                Tokens.ErrorType.InvalidToken,
                null,
                errorText.invalidToken,
                "Token payload is missing userId or jti"
            );
        }
    }

    export function validateToken(
        token: string,
        secret: string,
        logger: ILogger
    ): TokenPayload {
        try {
            const decoded = jwt.verify(token, secret, {
                algorithms: ["HS256"],
            }) as TokenPayload;
            return decoded;
        } catch (e: any /* eslint-disable-line */) {
            if (e.name === "TokenExpiredError") {
                throw new TokenError(
                    Tokens.ErrorType.ExpiredToken,
                    null,
                    errorText.tokenExpired,
                    e.message
                );
            } else {
                logger.error(e.message);
                throw new TokenError(
                    Tokens.ErrorType.InvalidToken,
                    null,
                    errorText.invalidToken,
                    `Token validation failed: ${e.message}`
                );
            }
        }
    }

    export async function refreshToken(
        user: IUser,
        providerRegistry: IProviderRegistry,
        secret: string,
        durationSeconds: number,
        logger: ILogger
    ) {
        const provider = providerRegistry.getProviderByName(user.provider);
        if (!provider) {
            throw new TokenError(
                Tokens.ErrorType.RefreshError,
                user,
                errorText.couldNotRefreshToken,
                "Provider could not be found for user"
            );
        }
        let newAccessToken: string | null = null;
        try {
            newAccessToken = await provider.refreshToken(user.refreshToken);
        } catch (refreshError) {
            throw new TokenError(
                Tokens.ErrorType.RefreshError,
                user,
                errorText.couldNotRefreshToken,
                `Error refreshing token ${refreshError.message}`
            );
        }
        if (!newAccessToken) {
            // Should not happen
            logger.warn(
                `Weird, this shouldn't happen. Refreshing token didn't fail, but no new token was returned`
            );
            throw new TokenError(
                Tokens.ErrorType.RefreshError,
                user,
                errorText.couldNotRefreshToken,
                "Provider returned no new token"
            );
        }
        const { token, id } = Tokens.createToken(
            secret,
            user,
            durationSeconds,
            false
        );
        return {
            newProviderToken: newAccessToken,
            newJWT: token,
            newJWTId: id,
        };
    }
}

export default Tokens;
