import { IUser } from "../../models/i-user";
import Tokens, { TokenError, TokenPayload } from "../tokens";
import jwt from "jsonwebtoken";

describe("Tokens", () => {
    let mockUser: Partial<IUser>;
    let secret: string;

    beforeEach(() => {
        mockUser = {
            id: "test_id",
            jwtId: "test_jwtId",
            name: "test_name",
            provider: "test_provider",
        };
        secret = "test_secret_134_456_789";
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
        const { token, id } = tokenObj;
        const decoded: TokenPayload = Tokens.decodeToken(token, secret);
        expect(decoded).toBeTruthy();
        expect(decoded).toHaveProperty("userId");
        expect(decoded).toHaveProperty("exp");
        expect(decoded).toHaveProperty("jti");
    });

    it("Should keep expiration date in seconds", () => {
        const now = Math.floor(Date.now() / 1000);
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        const { token, id } = tokenObj;
        const decoded: TokenPayload = Tokens.decodeToken(token, secret);
        expect(decoded.exp).toBe(now + 60 * 60);
    });

    it("Should respect user defined expiration", () => {
        const now = Math.floor(Date.now() / 1000);
        const tokenObj = Tokens.createToken(secret, mockUser as IUser, 10);
        const { token, id } = tokenObj;
        const decoded: TokenPayload = Tokens.decodeToken(token, secret);
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
            Tokens.decodeToken(token, secret);
        }).toThrow();
        try {
            Tokens.decodeToken(token, secret);
        } catch (err) {
            expect(err).toBeInstanceOf(TokenError);
        }
    });

    it("Should reject tokens with invalid signature", () => {
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        const { token, id } = tokenObj;
        const decoded: TokenPayload = Tokens.decodeToken(token, secret);
        expect(decoded).toBeTruthy();
        expect(decoded).toHaveProperty("userId");
        expect(decoded).toHaveProperty("exp");
        expect(decoded).toHaveProperty("jti");
        // change the secret
        const invalidSecret = "invalid_secret";
        expect(() => {
            Tokens.decodeToken(token, invalidSecret);
        }).toThrow();
    });

    it("Should reject token with mismatching jtis", () => {
        const tokenObj = Tokens.createToken(secret, mockUser as IUser);
        const { token, id } = tokenObj;
        const decoded: TokenPayload = Tokens.decodeToken(token, secret);
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
        const payload = Tokens.decodeToken(token, secret);
        expect(payload.jti).toBe(id);
    });
});
