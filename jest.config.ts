import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFiles: ["dotenv/config", "./copy-views.js"],
    testTimeout: 30000,
};

export default config;
