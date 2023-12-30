export interface IUser {
    _id?: unknown;
    id: string;
    jwtId: string | null;
    name: string;
    email: string;
    provider: string;
    providerId: string;
    token: string | null;
    refreshToken: string | null;
    verified: boolean;
    alias: string;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
}

export const TestUserData = {
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
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
} as IUser;
