import { MongoMemoryServer } from "mongodb-memory-server";

export async function startMockMongoDB(): Promise<string> {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    return mongoUri;
}

export default {
    startMockMongoDB,
};
