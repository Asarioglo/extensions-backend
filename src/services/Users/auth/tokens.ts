import { IUser } from "../models/i-user";
import jwt from "jsonwebtoken";
import AbstractAuthProvider from "./abstract-auth-provider";
import { ILogger } from "../../../core/logging/i-logger";

export type TokenPayload = {
    userId: string;
    exp: number;
    jti: string;
};

export class TokenError extends Error {
    public type: Tokens.ErrorType;
    public user: IUser | null;

    constructor(type: Tokens.ErrorType, user: IUser | null, message: string) {
        super(message);
        this.name = "TokenValidationError";
        this.type = type;
        this.user = user;
    }
}

namespace Tokens {
    export enum ErrorType {
        OutdatedToken,
        ExpiredToken,
        InvalidToken,
        NoProvider,
        RefreshError,
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
            throw new Error("Invalid user provided");
        }
        if (!durationSeconds) {
            durationSeconds = 60 * 60; // 1 hour
        }

        const tokenID = preserveJti
            ? user.jwtId
            : jwt.sign({ userId: user.id }, secret);

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
                "Token is no longer valid"
            );
        }
        return true;
    }

    export function decodeToken(
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
                    "Token expired, needs to be refreshed"
                );
            } else {
                logger.error(e.message);
                throw new Error(`Token validation failed: ${e.message}`);
            }
        }
    }

    export async function refreshProviderToken(
        user: IUser,
        providers: AbstractAuthProvider[],
        logger: ILogger
    ) {
        const provider = providers.find((p) => p.name === user.provider);
        if (!provider) {
            throw new TokenError(
                Tokens.ErrorType.NoProvider,
                user,
                "Provider could not be determined"
            );
        }
        let newAccessToken: string | null = null;
        try {
            newAccessToken = await provider.refreshToken(user.refreshToken);
        } catch (refreshError) {
            throw new TokenError(
                Tokens.ErrorType.RefreshError,
                user,
                "Error refreshing token"
            );
        }
        if (!newAccessToken) {
            // Should not happen
            logger.warn(
                `Weird, this shouldn't happen. Refreshing token didn't
                fail, but no new token was returned`
            );
            throw new TokenError(
                Tokens.ErrorType.RefreshError,
                user,
                "Error refreshing token"
            );
        }
        return newAccessToken;
    }
}

export default Tokens;
