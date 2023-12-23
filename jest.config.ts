import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/copy-views.js", "dotenv/config"],
    testTimeout: 30000,
};

export default config;
