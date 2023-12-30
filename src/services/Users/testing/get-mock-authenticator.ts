import IAuthenticator from "../models/i-authenticator";

export const getMockAuthenticator = (): IAuthenticator => {
    return {
        authenticateUserRequest: jest.fn(),
        setUserRepository: jest.fn(),
        createAuthToken: jest.fn(async () => {
            return "test_token";
        }),
        createOneTimeToken: jest.fn(async () => {
            return "test_token";
        }),
    };
};
