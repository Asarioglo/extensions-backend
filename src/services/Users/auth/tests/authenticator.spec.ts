/**
 * @jest-environment ./src/core/testing/test-env-with-config.ts
 */

import { Response, Router } from "express";
import { ConfigProvider } from "../../../../core/config/config-provider";
import Authenticator from "../authenticator";
import IDProviderRegistry from "../id-providers/id-provider-registry";
import passport from "passport";
import { MockIDProvider, getMockNext, getMockProvider } from "./mocks";
import { getMockExpress } from "../../../../core/testing/get-mock-express";
import strings from "../../views/assets/text/en-us.json";
import jwt from "jsonwebtoken";
import Tokens from "../tokens";
import { IUser } from "../../models/i-user";
import { getMockUserRepo } from "../../testing/mock-user-repo";
import { RequestWithUUID } from "../../../../core/interfaces/request-with-uuid";

const errorText = strings.errors;

describe("Authenticator", () => {
    let emptyProviderRegistry = new IDProviderRegistry();
    let emptyConfigProvidr = new ConfigProvider();
    let testRouter = {} as Router;
    let testUserRepo = getMockUserRepo();
    let testPassport = {} as passport.PassportStatic;
    let mockReq = {} as RequestWithUUID;
    let mockRes = {} as Response;
    let mockNext = getMockNext();

    const createAuthenticator = () => {
        return new Authenticator(
            emptyProviderRegistry,
            emptyConfigProvidr,
            testRouter,
            testUserRepo,
            testPassport
        );
    };

    const resetMocks = () => {
        const mockExpress = getMockExpress();
        mockReq = mockExpress.Request;
        mockRes = mockExpress.Response;
        mockNext = getMockNext();
    };

    beforeEach(() => {
        emptyConfigProvidr = new ConfigProvider();
        emptyProviderRegistry = new IDProviderRegistry();
        testRouter = {} as Router;
        testUserRepo = getMockUserRepo();
        testPassport = {} as passport.PassportStatic;
        resetMocks();
    });

    it("Should test for jwt secret and throw if not present", () => {
        expect(createAuthenticator).toThrow(Error);
        emptyConfigProvidr.set("jwt_secret", "test_secret");
        const authenticator = createAuthenticator();
        expect(authenticator).toBeTruthy();
    });

    it("Should honor jwt ttl and default to 3600 if not provided", () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");
        let authenticator = createAuthenticator();
        expect(authenticator).toBeTruthy();
        expect(authenticator.getTokenLifetime()).toBe(3600);

        emptyConfigProvidr.set("jwt_lifetime", "1234");
        authenticator = createAuthenticator();
        expect(authenticator).toBeTruthy();
        expect(authenticator.getTokenLifetime()).toBe(1234);
    });

    it("Should call initialize on providers", () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");
        emptyProviderRegistry.registerProvider(
            new MockIDProvider("test_provider")
        );
        emptyProviderRegistry.registerProvider(
            new MockIDProvider("test_provider2")
        );
        const authenticator = createAuthenticator();
        expect(authenticator).toBeTruthy();
        const p1 = emptyProviderRegistry.getProviderByName("test_provider");
        const p2 = emptyProviderRegistry.getProviderByName("test_provider2");
        expect(p1).toBeTruthy();
        expect(p1?.initialize).toHaveBeenCalled();
        expect(p1?.initialize).toHaveBeenCalledWith(
            testPassport,
            testRouter,
            authenticator
        );
        expect(p2).toBeTruthy();
        expect(p2?.initialize).toHaveBeenCalled();
        expect(p2?.initialize).toHaveBeenCalledWith(
            testPassport,
            testRouter,
            authenticator
        );
    });

    /**
     * This scenario only tests the method which checks that token exists and
     * is parseable. So even if the token is "a b" it will pass, because
     *  we are inly checking that token is two strings separated by a space.
     * JWT validity will be tested in the next test.
     * noToken message indicates the failure at the first step.
     */
    it("Should fail empty or missing tokens", () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");

        const auth = createAuthenticator();
        expect(auth).toBeTruthy();

        // No Token
        auth.authenticateUserRequest(mockReq, mockRes as Response, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.noToken,
        });
        expect(mockRes.send).not.toHaveBeenCalled();
        expect(mockRes.setHeader).not.toHaveBeenCalled();

        // Token present but invalid
        resetMocks();
        mockReq.headers.authorization = "invalid_token";
        auth.authenticateUserRequest(mockReq, mockRes as Response, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.noToken,
        });
        expect(mockRes.send).not.toHaveBeenCalled();
        expect(mockRes.setHeader).not.toHaveBeenCalled();

        // Token got a trailing space, so split(" ")[1] will be empty
        resetMocks();
        mockReq.headers.authorization = "invalid_token ";
        auth.authenticateUserRequest(mockReq, mockRes as Response, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.noToken,
        });
        expect(mockRes.send).not.toHaveBeenCalled();
        expect(mockRes.setHeader).not.toHaveBeenCalled();

        // All other errors
        resetMocks();
        mockReq.headers.authorization = "a b";
        auth.authenticateUserRequest(mockReq, mockRes as Response, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.invalidToken,
        });

        expect(testUserRepo.findById).not.toHaveBeenCalled();
    });

    it("Should test that token is a valid JWT", () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");

        const auth = createAuthenticator();
        expect(auth).toBeTruthy();

        mockReq.headers.authorization = "Bearer test_token";
        auth.authenticateUserRequest(mockReq, mockRes as Response, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.invalidToken,
        });
        expect(testUserRepo.findById).not.toHaveBeenCalled();
    });

    it("Should test that token contents are valid", () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");

        const auth = createAuthenticator();
        expect(auth).toBeTruthy();

        // No Token
        const payload = {
            test: 1,
        };
        const token = jwt.sign(
            JSON.parse(JSON.stringify(payload)),
            "test_secret",
            {
                algorithm: "HS256",
            }
        );
        // Token a valid JWT, but contents are invalid
        mockReq.headers.authorization = `Bearer ${token}`;
        auth.authenticateUserRequest(mockReq, mockRes as Response, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.invalidToken,
        });
        expect(testUserRepo.findById).not.toHaveBeenCalled();
    });

    it("Should fail if user can't be found in database", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");

        const { token } = Tokens.createToken(
            "test_secret",
            {
                id: "test_id",
                name: "test_name",
                provider: "test_provider",
            } as IUser,
            10
        );
        const auth = createAuthenticator();
        expect(auth).toBeTruthy();
        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.invalidToken,
        });
        expect(testUserRepo.findById).toHaveBeenCalledWith("test_id");
    });

    it("Should test that user JTI matches token JTI", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");

        const { token, id } = Tokens.createToken(
            "test_secret",
            {
                id: "test_id",
                name: "test_name",
                provider: "test_provider",
            } as IUser,
            10 // We don't want to have a successful validation jsut yet
        );
        testUserRepo = getMockUserRepo(true, "different_jti");
        const auth = createAuthenticator();
        expect(auth).toBeTruthy();
        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.anotherTokenIssued,
        });
        expect(testUserRepo.findById).toHaveBeenCalledWith("test_id");

        // Technically after jtis match we are good, because the expiration
        // is still valid.
        testUserRepo = getMockUserRepo(true, id);
        resetMocks();
        auth.setUserRepository(testUserRepo);
        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );
        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.user).toEqual(await testUserRepo.findById("test_id"));
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("Should test that expired tokens fail", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");

        const { token, id } = Tokens.createToken(
            "test_secret",
            {
                id: "test_id",
                name: "test_name",
                provider: "test_provider",
            } as IUser,
            -10 // expired from bi
        );
        const userRepo = getMockUserRepo(true, id);
        const auth = createAuthenticator();
        let provider = getMockProvider("test_provider");
        emptyProviderRegistry.registerProvider(provider);
        auth.setUserRepository(userRepo);
        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );

        expect(provider.refreshToken).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.tokenExpired,
        });

        emptyProviderRegistry.deregisterProvider(provider.name);

        provider = getMockProvider("test_provider", "no_token");
        emptyProviderRegistry.registerProvider(provider);
        resetMocks();

        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );

        expect(provider.refreshToken).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.tokenExpired,
        });
    });

    it("Should test that expired tokens refresh", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");

        const { token, id } = Tokens.createToken(
            "test_secret",
            {
                id: "test_id",
                name: "test_name",
                provider: "test_provider",
            } as IUser,
            -10 // expired from bi
        );
        const userRepo = getMockUserRepo(true, id);
        const auth = createAuthenticator();
        const provider = getMockProvider("test_provider", "success");
        emptyProviderRegistry.registerProvider(provider);
        auth.setUserRepository(userRepo);
        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );

        expect(provider.refreshToken).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.setHeader).toHaveBeenCalled();
        expect(userRepo.update).toHaveBeenCalled();
        // With a new token a new ID should be issued and saved to the user
        expect((mockReq.user as IUser).jwtId).not.toBe(id);
    });

    it("Should successfully authenticate with a valid token", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");
        const { token, id } = Tokens.createToken(
            "test_secret",
            {
                id: "test_id",
                name: "test_name",
                provider: "test_provider",
            } as IUser,
            10
        );
        const userRepo = getMockUserRepo(true, id);
        const auth = createAuthenticator();
        auth.setUserRepository(userRepo);
        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );
        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.setHeader).not.toHaveBeenCalled();
        // update last active
        expect(userRepo.update).toHaveBeenCalled();
        expect((mockReq.user as IUser).jwtId).toBe(id);
    });

    it("Should create a token and save JTI to user", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");
        const auth = createAuthenticator();
        const userRepo = getMockUserRepo(true, "my_jti");
        auth.setUserRepository(userRepo);
        const token = await auth.createAuthToken(
            (await userRepo.findById("test_id")) as IUser
        );
        expect(token).toBeTruthy();
        const decoded = Tokens.decodeToken(token);
        expect(decoded.jti).not.toBe("my_jti");
        expect(userRepo.update).toHaveBeenCalled();
        mockReq.headers.authorization = `Bearer ${token}`;
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );
        expect(mockNext).toHaveBeenCalled();
    });

    it("Should create a valid one time token and validate it", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");
        const auth = createAuthenticator();
        const userRepo = getMockUserRepo(true, "my_jti");
        auth.setUserRepository(userRepo);
        const token = await auth.createOneTimeToken(
            (await userRepo.findById("test_id")) as IUser
        );
        expect(token).toBeTruthy();
        const decoded = Tokens.decodeToken(token);
        expect(decoded.jti).toBe("my_jti");
        expect(userRepo.update).not.toHaveBeenCalled();
        mockReq.query = { ot_code: token };
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );
        expect(mockNext).toHaveBeenCalled();
    });

    it("Should not attempt to refresh a one time token", async () => {
        emptyConfigProvidr.set("jwt_secret", "test_secret");
        const auth = createAuthenticator();
        const userRepo = getMockUserRepo(true, "my_jti");
        const test_user = (await userRepo.findById("my_id")) as IUser;
        const mockProvider = getMockProvider(test_user?.provider, "success");
        emptyProviderRegistry.registerProvider(mockProvider);
        auth.setUserRepository(userRepo);
        const token = await auth.createOneTimeToken(
            (await userRepo.findById("test_id")) as IUser,
            -1 // expired at birth
        );
        mockReq.query = { ot_code: token };
        await auth.authenticateUserRequest(
            mockReq,
            mockRes as Response,
            mockNext
        );
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: errorText.oneTimeTokenExpired,
        });
        expect(mockProvider.refreshToken).not.toHaveBeenCalled();
    });
});
