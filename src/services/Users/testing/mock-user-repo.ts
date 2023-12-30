import IUserRepository from "../database/base/i-user-repository";
import { IUser } from "../models/i-user";

export const getMockUserRepo = (hasUser: boolean = false, jti: string = "") => {
    class MockUserRepo implements IUserRepository {
        findById = jest.fn(async (userId: string) => {
            if (hasUser) {
                return {
                    id: userId,
                    jwtId: jti,
                    name: "test_name",
                    provider: "test_provider",
                } as IUser;
            }
            return null;
        });
        findOrCreate = jest.fn(async (user: Partial<IUser>) => {
            if (hasUser) {
                return {
                    ...user,
                    id: "test_id",
                    jwtId: jti,
                } as IUser;
            }
            return null;
        });
        update = jest.fn(async (query, update) => {
            return {
                ...query,
                ...update,
            };
        });
        delete = jest.fn();
        findOne = jest.fn();
    }

    return new MockUserRepo();
};
