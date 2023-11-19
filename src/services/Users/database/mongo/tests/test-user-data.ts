import { IUser } from "../../../models/i-user";

export default {
    id: "test_id",
    jwtId: "test_jwtId",
    name: "test_name",
    email: "test_email",
    provider: "test_provider",
    providerId: "test_providerId",
    token: "test_token",
    refreshToken: "test_refreshToken",
    verified: false,
    alias: "test_alias",
    lastActive: "test_lastActive",

    save: jest.fn(),
} as IUser;
