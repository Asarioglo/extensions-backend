/**
 * @jest-environment ./src/core/testing/test-env-with-config.ts
 */

import { ConfigProvider } from "../core/config/config-provider";
import { IConfigProvider } from "../core/interfaces/i-config-provider";
import Logger from "../core/logging/logger";
import DevLogger from "../core/logging/dev-logger";
import fs from "fs";
import path from "path";
import os from "os";

async function runLogs(logger: Logger, timeout: number = 500) {
    return new Promise((resolve) => {
        logger.error("Test logging error");
        logger.access("Test logging access");
        logger.warn("Test logging warn");
        logger.info("Test logging info");
        logger.debug("Test logging debug");
        // .5 second should be enough to write to file.
        setTimeout(() => {
            resolve(true);
        }, timeout);
    });
}

describe("Logging", () => {
    let configProvider: IConfigProvider;
    let cfgProvider: ConfigProvider;
    const logDirectory = path.join(os.homedir(), "ext-backend", "logs-test");
    let logFiles: string[] | null = null;

    function numberOfFiles() {
        if (!fs.existsSync(logDirectory)) {
            return 0;
        }
        logFiles = fs.readdirSync(logDirectory);
        return logFiles.length;
    }

    function getLogFileByName(name: string) {
        if (!fs.existsSync(logDirectory)) {
            return null;
        }
        if (logFiles === null) {
            logFiles = fs.readdirSync(logDirectory);
        }
        const logFile = logFiles.find((file) => file === name);
        return logFile || null;
    }

    function getNumLines(logFile: string) {
        const logFileContent = fs.readFileSync(
            path.join(logDirectory, logFile),
            "utf8"
        );
        const lines = logFileContent.split("\n");
        return lines.length;
    }

    beforeEach(() => {
        configProvider = globalThis.__configProvider as IConfigProvider;
        // to stop the assigned but not used error
        configProvider.get("log_location", logDirectory);
        cfgProvider = new ConfigProvider();
    });

    afterEach(() => {
        // clean up log files
        if (logFiles) {
            for (const logFile of logFiles) {
                fs.unlinkSync(path.join(logDirectory, logFile));
            }
        }
        if (fs.existsSync(logDirectory)) fs.rmdirSync(logDirectory);
        logFiles = null;
    });
    it("Should default to error level with /tmp/datempow/logs", async () => {
        cfgProvider.set("log_location", logDirectory);
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(1);
        const logFile = getLogFileByName("error.log");
        expect(logFile).toBeDefined();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end
    });

    it("Should properly log at access level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "access");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(2);
        const logFile = getLogFileByName("access.log");
        expect(logFile).toBeDefined();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the access log didn't log anywhere else
        const errorLogFile = getLogFileByName("error.log");
        expect(errorLogFile).toBeDefined();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should properly log at warn level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "warn");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(3);
        const logFile = getLogFileByName("warn.log");
        expect(logFile).toBeDefined();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the warn log didn't log anywhere else
        const accessLogFile = getLogFileByName("access.log");
        expect(accessLogFile).toBeDefined();
        expect(getNumLines(accessLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the warn log didn't log anywhere else
        const errorLogFile = getLogFileByName("error.log");
        expect(errorLogFile).toBeDefined();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should properly log at info level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "info");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(4);
        const logFile = getLogFileByName("info.log");
        expect(logFile).toBeDefined();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the info log didn't log anywhere else
        const warnLogFile = getLogFileByName("warn.log");
        expect(warnLogFile).toBeDefined();
        expect(getNumLines(warnLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the info log didn't log anywhere else
        const accessLogFile = getLogFileByName("access.log");
        expect(accessLogFile).toBeDefined();
        expect(getNumLines(accessLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the info log didn't log anywhere else
        const errorLogFile = getLogFileByName("error.log");
        expect(errorLogFile).toBeDefined();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should properly log at debug level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "debug");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(5);
        const logFile = getLogFileByName("debug.log");
        expect(logFile).toBeDefined();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const infoLogFile = getLogFileByName("info.log");
        expect(infoLogFile).toBeDefined();
        expect(getNumLines(infoLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const warnLogFile = getLogFileByName("warn.log");
        expect(warnLogFile).toBeDefined();
        expect(getNumLines(warnLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const accessLogFile = getLogFileByName("access.log");
        expect(accessLogFile).toBeDefined();
        expect(getNumLines(accessLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const errorLogFile = getLogFileByName("error.log");
        expect(errorLogFile).toBeDefined();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should dev log to console and not to files", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "debug");
        const logger = new DevLogger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(0);
    });

    it("Should log with data", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "debug");
        const logger = new Logger(cfgProvider);

        await new Promise((resolve) => {
            logger.error("Test logging error with data", {
                data: { foo: "bar" },
            });
            logger.access("Test logging access with data", {
                data: { foo: "bar" },
            });
            logger.warn("Test logging warn with data", {
                data: { foo: "bar" },
            });
            logger.info("Test logging info with data", {
                data: { foo: "bar" },
            });
            logger.debug("Test logging debug with data", {
                data: { foo: "bar" },
            });
            // .5 second should be enough to write to file. If not, increase timeout
            setTimeout(() => {
                resolve(true);
            }, 500);
        });

        // 1 second should be enough to write to file. If not, increase timeout
        expect(numberOfFiles()).toBe(5);
        function testHasData(fileName: string) {
            const logFile = getLogFileByName(fileName);
            expect(logFile).toBeTruthy();
            if (!logFile) {
                return;
            }
            const logFileContent = fs.readFileSync(
                path.join(logDirectory, logFile),
                "utf8"
            );
            const lines = logFileContent.split("\n");
            const parsed = JSON.parse(lines[0]);
            expect(parsed).toBeDefined();
            expect(parsed).toHaveProperty("data");
            expect(parsed.data).toHaveProperty("foo");
            expect(parsed.data.foo).toBe("bar");
        }

        testHasData("error.log");
        testHasData("access.log");
        testHasData("warn.log");
        testHasData("info.log");
        testHasData("debug.log");
    });
});
