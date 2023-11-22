/**
 * @jest-environment ./src/core/testing/test-env-with-mongo.ts
 */

import mongoose from "mongoose";
import MongoUserRepo from "../mongo-user-repo";
import { IUser, TestUserData } from "../../../models/i-user";
import { UserCallback } from "../../base/i-user-repository";

describe("Mongo User Repository", () => {
    let connection: mongoose.Connection | null = null;

    beforeEach(async () => {
        const mongoUri = globalThis.__configProvider.get("mongo_uri", null);
        expect(mongoUri).toBeDefined();
        connection = await mongoose.createConnection(mongoUri).asPromise();
    });

    afterEach(async () => {
        if (connection) {
            await connection.close();
            connection = null;
        }
    });

    it("Should instantiate the repository", async () => {
        if (!connection) throw new Error("Connection did not initialize");

        const repo = new MongoUserRepo(connection);
        // verify user model created in constructor
        expect(repo).toBeDefined();
        const models = connection.modelNames();
        expect(models).toBeDefined();
        expect(models).toContain("User");
    });

    it("Should create a user and return promise", async () => {
        if (!connection) throw new Error("Connection did not initialize");

        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData);
        expect(user).toBeDefined();
        if (!user) throw new Error("User did not initialize");
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("jwtId", TestUserData.jwtId);
        expect(user).toHaveProperty("name", TestUserData.name);
        expect(user).toHaveProperty("email", TestUserData.email);
        expect(user).toHaveProperty("provider", TestUserData.provider);
        expect(user).toHaveProperty("providerId", TestUserData.providerId);
        expect(user).toHaveProperty("token", TestUserData.token);
        expect(user).toHaveProperty("refreshToken", TestUserData.refreshToken);
        expect(user).toHaveProperty("verified", true);
        expect(user).toHaveProperty(
            "alias",
            TestUserData.email.substring(0, 2).toUpperCase()
        );
        expect(user).toHaveProperty("lastActive");
        expect(user.lastActive).toBeInstanceOf(Date);
        expect(user).toHaveProperty("createdAt");
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user).toHaveProperty("updatedAt");
        expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("Should create a user and return callback", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const cb = jest.fn() as UserCallback;
        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData, cb);
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(null, user);
    });

    it("Should fail gracefully creating a user", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        await expect(repo.findOrCreate({} as IUser)).rejects.toThrow();
        const noParamsCb = jest.fn() as UserCallback;
        await repo.findOrCreate({} as IUser, noParamsCb);
        expect(noParamsCb).toHaveBeenCalled();
        expect(noParamsCb).toHaveBeenCalledWith(expect.any(Error), null);
        // passing a non-string value to providerId will make it fail at
        // lookup time
        await expect(
            repo.findOrCreate({ ...TestUserData, providerId: {} } as IUser)
        ).rejects.toThrow();
        const cb = jest.fn() as UserCallback;
        await repo.findOrCreate(
            { ...TestUserData, providerId: {} } as IUser,
            cb
        );
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(expect.any(Error), null);

        // passing a non-string value to name will make it fail at create time
        await expect(
            repo.findOrCreate({
                ...TestUserData,
                providerId: "123",
                name: {},
            } as IUser)
        ).rejects.toThrow();
        const cb2 = jest.fn() as UserCallback;
        await repo.findOrCreate(
            { ...TestUserData, providerId: "123", name: {} } as IUser,
            cb2
        );
        expect(cb2).toHaveBeenCalled();
        expect(cb2).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it("Should find a user instead of creating", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData);
        const userDataCache = { ...TestUserData, name: "new_name" };
        // will only use providerId to find user, so this should return the
        // same user without the new_name
        const user2 = await repo.findOrCreate(userDataCache);
        expect(user2).toBeDefined();
        // to fool typescript
        if (!user2) throw new Error("User did not initialize");
        expect(user2).toEqual(user);
        expect(user2.name).not.toEqual(userDataCache.name);
    });

    it("Should find a user by id", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData);
        expect(user).toBeTruthy();
        if (!user) throw new Error("User did not initialize");
        const user2 = await repo.findById(user.id);
        expect(user2).toBeTruthy();
        expect(user2).toEqual(user);
    });

    it("Should find a user by id with callback", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData);
        expect(user).toBeTruthy();
        if (!user) throw new Error("User did not initialize");

        const cb = jest.fn() as UserCallback;
        const user2 = await repo.findById(user.id, cb);
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(null, user);
        expect(user2).toBeTruthy();
        expect(user2).toEqual(user);
    });

    it("Should fail gracefully finding a user by id", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        await expect(repo.findById("")).rejects.toThrow();
        const cb = jest.fn() as UserCallback;
        await repo.findById("", cb);
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it("Should not find a user", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        const user = await repo.findById("123456789012345678901234");
        expect(user).toBeNull();
        const cb = jest.fn() as UserCallback;
        await repo.findById("123456789012345678901234", cb);
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(null, null);
    });

    it("Should find a user by other parameters", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData);
        const user2 = await repo.findOne({
            name: TestUserData.name,
            email: TestUserData.email,
        });
        expect(user2).toBeDefined();
        expect(user2).toEqual(user);

        const cb = jest.fn() as UserCallback;
        await repo.findOne(
            {
                name: TestUserData.name,
                email: TestUserData.email,
            },
            cb
        );
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(null, user);
    });

    it("Should not find a user by other parameters", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        await repo.findOrCreate(TestUserData);
        const user2 = await repo.findOne({
            name: TestUserData.name,
            email: "test@gmail.com",
        });
        expect(user2).toBeNull();

        const cb = jest.fn() as UserCallback;
        await repo.findOne(
            {
                name: TestUserData.name,
                email: "test@gmail.com",
            },
            cb
        );
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(null, null);
    });

    it("Should fail gracefully finding a user by other parameters", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        await expect(repo.findOne({ name: {} } as IUser)).rejects.toThrow();
        const cb = jest.fn() as UserCallback;
        await repo.findOne({ name: {} } as IUser, cb);
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it("Should update a user", async () => {
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData);
        expect(user).toBeTruthy();
        if (!user) throw new Error("User did not initialize");
        const user2 = await repo.update(
            { providerId: TestUserData.providerId, email: TestUserData.email },
            {
                name: "new_name",
                email: "new_email",
            }
        );
        expect(user2).toBeTruthy();
        if (!user2) throw new Error("User did not initialize");
        expect(user2.name).toEqual("new_name");
        const user3 = await repo.findById(user.id);
        expect(user3).toBeDefined();
        expect(user3).toEqual(user2);
    });

    it("Should fail gracefully updating a user", async () => {
        // -------------- Wrong Required Params --------------
        if (!connection) throw new Error("Connection did not initialize");
        const repo = new MongoUserRepo(connection);
        await expect(
            repo.update({ name: {} } as IUser, { name: "new_name" })
        ).rejects.toThrow();
        const cb = jest.fn() as UserCallback;
        await repo.update({ name: {} } as IUser, { name: "new_name" }, cb);
        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(expect.any(Error), null);
        // -------------- Wrong Update Params --------------
        await expect(
            repo.update(
                {
                    providerId: TestUserData.providerId,
                    email: TestUserData.email,
                },
                { name: {} } as IUser
            )
        ).rejects.toThrow();
        const cb2 = jest.fn() as UserCallback;
        await repo.update(
            {
                providerId: TestUserData.providerId,
                email: TestUserData.email,
            },
            { name: {} } as IUser,
            cb2
        );
    });
});
