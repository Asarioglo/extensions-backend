/**
 * @jest-environment ./src/core/testing/test-env-with-config.ts
 */

import { ILogger } from "../../../../core/logging/i-logger";
import { IUser } from "../../models/i-user";
import Tokens, { TokenError, TokenPayload } from "../tokens";
import jwt from "jsonwebtoken";
import { MockIDProvider } from "./mocks";
import IProviderRegistry from "../../models/i-provider-registry";
import IDProviderRegistry from "../id-providers/id-provider-registry";

describe("Tokens", () => {
    let mockUser: Partial<IUser>;
    let secret: string;
    let logger: ILogger;
    let providers: IProviderRegistry;

    beforeEach(() => {
        mockUser = {
            id: "test_id",
            jwtId: "test_jwtId",
            name: "test_name",
            provider: "test_provider",
        };
        secret = "test_secret_134_456_789";
        logger = globalThis.__logger as ILogger;
        providers = new IDProviderRegistry();
        providers.registerProvider(new MockIDProvider("test_provider"));
        providers.registerProvider(new MockIDProvider("test_provider2"));
    });

    it("Sanity JWT check", () => {
        const token = jwt.sign({ foo: "bar" }, secret);
        const decoded = jwt.verify(token, secret);
        expect(decoded).toBeTruthy();
    });

    it("Should craete token with default values", () => {
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        expect(tokenObj).toBeTruthy();
        expect(tokenObj).toHaveProperty("token");
        expect(tokenObj).toHaveProperty("id");
        // token and id should be strings
        expect(typeof tokenObj.token).toBe("string");
        expect(typeof tokenObj.id).toBe("string");
    });

    it("Should decode a token correctly", () => {
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        const { token } = tokenObj;
        const decoded: TokenPayload = Tokens.validateToken(
            token,
            secret,
            globalThis.__logger as ILogger
        );
        expect(decoded).toBeTruthy();
        expect(decoded).toHaveProperty("userId");
        expect(decoded).toHaveProperty("exp");
        expect(decoded).toHaveProperty("jti");
    });

    it("Should keep expiration date in seconds", () => {
        const now = Math.floor(Date.now() / 1000);
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        const { token } = tokenObj;
        const decoded: TokenPayload = Tokens.validateToken(
            token,
            secret,
            globalThis.__logger as ILogger
        );
        expect(decoded.exp).toBe(now + 60 * 60);
    });

    it("Should respect user defined expiration", () => {
        const now = Math.floor(Date.now() / 1000);
        const tokenObj = Tokens.createToken(secret, mockUser as IUser, 10);
        const { token } = tokenObj;
        const decoded: TokenPayload = Tokens.validateToken(
            token,
            secret,
            globalThis.__logger as ILogger
        );
        expect(decoded).toBeTruthy();
        expect(decoded).toHaveProperty("userId");
        expect(decoded).toHaveProperty("exp");
        expect(decoded).toHaveProperty("jti");
        expect(decoded.exp).toBe(now + 10);
    });

    it("Should reject expired tokens", () => {
        const tokenObj = Tokens.createToken(secret, mockUser as IUser, -1);
        const { token } = tokenObj;
        expect(() => {
            Tokens.validateToken(token, secret, globalThis.__logger as ILogger);
        }).toThrow();
        try {
            Tokens.validateToken(token, secret, globalThis.__logger as ILogger);
        } catch (err) {
            expect(err).toBeInstanceOf(TokenError);
        }
    });

    it("Should reject tokens with invalid signature", () => {
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        const { token } = tokenObj;
        const decoded: TokenPayload = Tokens.validateToken(
            token,
            secret,
            globalThis.__logger as ILogger
        );
        expect(decoded).toBeTruthy();
        expect(decoded).toHaveProperty("userId");
        expect(decoded).toHaveProperty("exp");
        expect(decoded).toHaveProperty("jti");
        // change the secret
        const invalidSecret = "invalid_secret";
        expect(() => {
            Tokens.validateToken(
                token,
                invalidSecret,
                globalThis.__logger as ILogger
            );
        }).toThrow();
    });

    it("Should reject token with mismatching jtis", () => {
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        const { token, id } = tokenObj;
        const decoded: TokenPayload = Tokens.validateToken(
            token,
            secret,
            globalThis.__logger as ILogger
        );
        expect(decoded.jti).toBe(id);
        mockUser.jwtId = id;
        expect(Tokens.additionalValidation(decoded, mockUser as IUser)).toBe(
            true
        );
        // change the jti
        decoded.jti = "mismatching_jti";
        expect(() => {
            Tokens.additionalValidation(decoded, mockUser as IUser);
        }).toThrow();
        decoded.jti = id;
        expect(Tokens.additionalValidation(decoded, mockUser as IUser)).toBe(
            true
        );
        mockUser.jwtId = "mismatching_jti";
        expect(() => {
            Tokens.additionalValidation(decoded, mockUser as IUser);
        }).toThrow();
    });

    it("Should create a token with user defined jti", () => {
        const tokenObj = Tokens.createToken(
            secret,
            mockUser as IUser,
            undefined,
            true
        );
        const { token, id } = tokenObj;
        expect(id).toBe(mockUser.jwtId);
        const payload = Tokens.decodeToken(token);
        expect(payload.jti).toBe(id);
    });

    it("Should fail to refresh token with missing provider", async () => {
        expect(
            Tokens.refreshToken(
                mockUser as IUser,
                new IDProviderRegistry(),
                secret,
                100,
                logger
            )
        ).rejects.toThrow(TokenError);
    });

    it("Should refresh provider token and generate a new JWT", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { newProviderToken, newJWT, newJWTId } =
            await Tokens.refreshToken(
                mockUser as IUser,
                providers,
                secret,
                100,
                logger
            );
        expect(newProviderToken).toBeTruthy();
        expect(newJWT).toBeTruthy();
        expect(newJWTId).toBeTruthy();
    });

    it("Should honor additional payload", async () => {
        const { token } = Tokens.createToken(
            secret,
            mockUser as IUser,
            undefined,
            true,
            { foo: "bar" }
        );
        const payload = Tokens.decodeToken(token);
        expect(payload).toBeTruthy();
        expect(payload).toHaveProperty("foo");
        expect(() => Tokens.testTokenPayload(payload)).not.toThrow();
        expect(Tokens.testTokenPayload(payload)).toBe(true);
    });
});
