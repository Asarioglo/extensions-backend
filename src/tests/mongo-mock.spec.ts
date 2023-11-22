/**
 * @jest-environment ./src/core/testing/test-env-with-mongo.ts
 */
import mongoose from "mongoose";

describe("Mongo Mock", () => {
    it("Should start mock mongo db", async () => {
        expect(globalThis.__configProvider).toBeDefined();

        const mongoUri = globalThis.__configProvider.get("mongo_uri", null);
        expect(mongoUri).toBeDefined();
        const connection = await mongoose
            .createConnection(mongoUri)
            .asPromise();
        expect(connection).toBeDefined();

        await connection.close();

        return true;
    });

    it("Should execute a query on mock db", async () => {
        const mongoUri = globalThis.__configProvider.get("mongo_uri", null);
        const connection = await mongoose
            .createConnection(mongoUri)
            .asPromise();
        expect(connection).toBeDefined();

        const TestSchema = new mongoose.Schema({
            name: String,
        });
        const TestModel = connection.model("Test", TestSchema);

        const test = new TestModel({ name: "test" });
        await test.save();
        const test1 = new TestModel({ name: "test1" });
        await test1.save();

        const result = await TestModel.findOne({ name: "test" });
        expect(result).toBeDefined();
        expect(result?.name).toBe("test");

        const tests = await TestModel.find();
        expect(tests).toBeDefined();
        expect(tests.length).toBe(2);

        await connection.close();

        return true;
    });
});
