export interface IUser {
    id: string;
    jwtId: string;
    name: string;
    email: string;
    provider: string;
    providerId: string;
    token: string;
    refreshToken: string;
    verified: boolean;
    alias: string;
    lastActive: number | string | Date;

    save(): Promise<IUser>;
}
