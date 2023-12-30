import IUserRepository from "../database/base/i-user-repository";
import { IUser } from "../models/i-user";

export const getMockUserRepo = (hasUser: boolean = false, jti: string = "") => {
    class MockUserRepo implements IUserRepository {
        private _user = {
            jwtId: jti,
            name: "test_name",
            provider: "test_provider",
        } as IUser;

        _setMockUserInfo(user: Partial<IUser>) {
            this._user = {
                ...this._user,
                ...user,
            };
        }

        findById = jest.fn(async (userId: string) => {
            if (hasUser) {
                return {
                    ...this._user,
                    id: userId,
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
            this._setMockUserInfo(update);
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
