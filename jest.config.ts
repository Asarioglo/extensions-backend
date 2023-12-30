import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "<rootDir>/src/core/testing/test-env-with-config.ts",
    setupFiles: ["dotenv/config"],
    globalSetup: "<rootDir>/copy-views.js",
    testTimeout: 30000,
};

export default config;
