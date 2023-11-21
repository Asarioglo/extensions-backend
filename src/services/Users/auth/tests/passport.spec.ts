import passport from "passport";
import configurePassport from "../passport";
import IUserRepository, {
    UserCallback,
} from "../../database/base/i-user-repository";
import { IUser, TestUserData } from "../../models/i-user";
import { RepoCallback } from "../../../../core/interfaces/i-repository";
import AbstractAuthProvider from "../abstract-auth-provider";

namespace MockPassport {
    export const serializeUser = jest.fn();
    export const deserializeUser = jest.fn();
}

namespace TestPassport {
    export let serializeUserFn: any = null;
    export let deserializeUserFn: any = null;
    export function serializeUser(fn: any) {
        serializeUserFn = fn;
    }
    export function deserializeUser(fn: any) {
        deserializeUserFn = fn;
    }
}

class MockAuthProvider extends AbstractAuthProvider {
    constructor() {
        super("mock_provider");
    }
    // eslint-disable-next-line no-unused-vars
    addPassportStrategy = jest.fn();

    addLoginRoutes = jest.fn();

    refreshToken = jest.fn();
}

class MockUserRepo implements IUserRepository {
    findById(
        id: string,
        callback?: RepoCallback<IUser> | undefined
    ): Promise<IUser> {
        if (callback) callback(null, TestUserData);
        return Promise.resolve(TestUserData);
    }

    findOrCreate(
        queryData: Partial<IUser>,
        callback?: RepoCallback<IUser> | undefined
    ): Promise<IUser> {
        if (callback) callback(null, TestUserData);
        return Promise.resolve(TestUserData);
    }

    findOne(
        queryData: Partial<IUser>,
        callback: RepoCallback<IUser>
    ): Promise<IUser> {
        if (callback) callback(null, TestUserData);
        return Promise.resolve(TestUserData);
    }

    update(
        queryData: Partial<IUser>,
        updateData: Partial<IUser>,
        callback?: RepoCallback<IUser> | undefined
    ): Promise<IUser> {
        if (callback) callback(null, TestUserData);
        return Promise.resolve(TestUserData);
    }
}

describe("passport", () => {
    beforeEach(() => {});

    it("should call serialize and deserialize user functions", () => {
        configurePassport(MockPassport as any, new MockUserRepo(), []);
        expect(MockPassport.serializeUser).toHaveBeenCalled();
        expect(MockPassport.deserializeUser).toHaveBeenCalled();
    });

    it("should serialize and deserialize user by ID", (done) => {
        configurePassport(TestPassport as any, new MockUserRepo(), []);
        let xpressDone = jest.fn();
        const user = TestPassport.serializeUserFn(TestUserData, xpressDone);
        expect(xpressDone).toHaveBeenCalled();
        expect(xpressDone).toHaveBeenCalledWith(null, TestUserData.id);

        let doneAsyncCallback = (err: any, user: IUser) => {
            expect(err).toBeNull();
            expect(user).toEqual(TestUserData);
            done();
        };
        TestPassport.deserializeUserFn(TestUserData.id, doneAsyncCallback);
    });

    it("should iterate through providers and add passport strategies", () => {
        const providers = [new MockAuthProvider(), new MockAuthProvider()];
        configurePassport(TestPassport as any, new MockUserRepo(), providers);
        expect(providers[0].addPassportStrategy).toHaveBeenCalled();
        expect(providers[0].addPassportStrategy).toHaveBeenCalledWith(
            TestPassport
        );
        expect(providers[1].addPassportStrategy).toHaveBeenCalled();
        expect(providers[1].addPassportStrategy).toHaveBeenCalledWith(
            TestPassport
        );
    });
});
