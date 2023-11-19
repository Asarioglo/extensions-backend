/**
 * @jest-environment ./src/core/testing/mongo-test-environment.ts
 */

import mongoose, { mongo } from "mongoose";
import MongoUserRepo from "../mongo-user-repo";
import TestUserData from "./test-user-data";

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

    it("Should create a user", async () => {
        if (!connection) throw new Error("Connection did not initialize");

        const repo = new MongoUserRepo(connection);
        const user = await repo.findOrCreate(TestUserData);
        expect(user).toBeDefined();
        const userData = user.toObject();
        expect(user).toHaveProperty("id", TestUserData.id);
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
        expect(user).toHaveProperty("lastActive", TestUserData.lastActive);
    });
});
