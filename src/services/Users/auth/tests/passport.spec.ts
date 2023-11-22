import configurePassport from "../passport";
import IUserRepository from "../../database/base/i-user-repository";
import { IUser, TestUserData } from "../../models/i-user";
import { RepoCallback } from "../../../../core/interfaces/i-repository";
import AbstractAuthProvider from "../abstract-auth-provider";

class MockPassport {
    static serializeUser = jest.fn();
    static deserializeUser = jest.fn();
}

type SerializeUserFn = (user: IUser, done: () => void) => IUser;
type DeserializeUserFn = (
    id: string,
    done: (err: Error | null, user: IUser | null) => void
) => void;

class TestPassport {
    static serializeUserFn: SerializeUserFn | null = null;
    static deserializeUserFn: DeserializeUserFn | null = null;
    static serializeUser(fn: SerializeUserFn) {
        TestPassport.serializeUserFn = fn;
    }
    static deserializeUser(fn: DeserializeUserFn) {
        TestPassport.deserializeUserFn = fn;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configurePassport(MockPassport as any, new MockUserRepo(), []);
        expect(MockPassport.serializeUser).toHaveBeenCalled();
        expect(MockPassport.deserializeUser).toHaveBeenCalled();
    });

    it("should serialize and deserialize user by ID", (done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configurePassport(TestPassport as any, new MockUserRepo(), []);
        const xpressDone = jest.fn();
        TestPassport.serializeUserFn?.(TestUserData, xpressDone);
        expect(xpressDone).toHaveBeenCalled();
        expect(xpressDone).toHaveBeenCalledWith(null, TestUserData.id);

        const doneAsyncCallback = (err: Error | null, user: IUser | null) => {
            expect(err).toBeNull();
            expect(user).toEqual(TestUserData);
            done();
        };
        TestPassport.deserializeUserFn?.(TestUserData.id, doneAsyncCallback);
    });

    it("should iterate through providers and add passport strategies", () => {
        const providers = [new MockAuthProvider(), new MockAuthProvider()];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
