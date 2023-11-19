import passport from "passport";
import configurePassport from "../passport";
import AbstractUserRepo, {
    UserCallback,
} from "../../database/base/abstract-user-repo";
import { IUser } from "../../models/i-user";
import { RepoCallback } from "../../../../core/database/abstract-repository";
import AbstractAuthProvider from "../abstract-auth-provider";

const testUser: IUser = {
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

    async save() {
        return this;
    },
};

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

class MockUserRepo extends AbstractUserRepo {
    findById(
        id: string,
        callback?: RepoCallback<IUser> | undefined
    ): void | Promise<IUser> {
        if (!callback) return Promise.resolve(testUser);
        else callback(null, testUser);
    }

    findOrCreate(
        queryData: Partial<IUser>,
        callback?: RepoCallback<IUser> | undefined
    ): void | Promise<IUser> {
        if (!callback) return Promise.resolve(testUser);
    }

    findOne(
        queryData: Partial<IUser>,
        callback: RepoCallback<IUser>
    ): void | Promise<IUser> {
        return Promise.resolve(testUser);
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
        const user = TestPassport.serializeUserFn(testUser, xpressDone);
        expect(xpressDone).toHaveBeenCalled();
        expect(xpressDone).toHaveBeenCalledWith(null, testUser.id);

        let doneAsyncCallback = (err: any, user: IUser) => {
            expect(err).toBeNull();
            expect(user).toEqual(testUser);
            done();
        };
        TestPassport.deserializeUserFn(testUser.id, doneAsyncCallback);
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
