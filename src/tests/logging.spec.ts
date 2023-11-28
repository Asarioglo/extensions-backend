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
        logger.error("Test logging error", {
            data: { foo: "bar" },
        });
        logger.access("Test logging access", {
            data: { foo: "bar" },
        });
        logger.warn("Test logging warn", {
            data: { foo: "bar" },
        });
        logger.info("Test logging info", {
            data: { foo: "bar" },
        });
        logger.debug("Test logging debug", {
            data: { foo: "bar" },
        });
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
        const allFiles = fs.readdirSync(logDirectory);
        const logFiles = allFiles.filter((file) => file.endsWith(".log"));
        return logFiles.length;
    }

    function getLogFileByType(name: string) {
        if (!fs.existsSync(logDirectory)) {
            return null;
        }
        if (logFiles === null) {
            const allFiles = fs.readdirSync(logDirectory);
            logFiles = allFiles.filter((file) => file.endsWith(".log"));
        }
        const logFile = logFiles.find((file) => file.includes(name));
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
        if (!fs.existsSync(logDirectory)) {
            return;
        }
        const allFiles = fs.readdirSync(logDirectory);
        for (const f of allFiles) {
            fs.unlinkSync(path.join(logDirectory, f));
        }
        if (fs.existsSync(logDirectory)) fs.rmdirSync(logDirectory);
        logFiles = null;
    });
    it("Should default to error level with /tmp/datempow/logs", async () => {
        cfgProvider.set("log_location", logDirectory);
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        // one *.audit.json per log file
        expect(numberOfFiles()).toBe(1);
        const logFile = getLogFileByType("error");
        expect(logFile).toBeTruthy();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end
    });

    it("Should properly log at access level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "access");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(2);
        const logFile = getLogFileByType("access");
        expect(logFile).toBeTruthy();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the access log didn't log anywhere else
        const errorLogFile = getLogFileByType("error");
        expect(errorLogFile).toBeTruthy();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should properly log at warn level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "warn");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(3);
        const logFile = getLogFileByType("warn");
        expect(logFile).toBeTruthy();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the warn log didn't log anywhere else
        const accessLogFile = getLogFileByType("access");
        expect(accessLogFile).toBeTruthy();
        expect(getNumLines(accessLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the warn log didn't log anywhere else
        const errorLogFile = getLogFileByType("error");
        expect(errorLogFile).toBeTruthy();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should properly log at info level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "info");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(4);
        const logFile = getLogFileByType("info");
        expect(logFile).toBeTruthy();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the info log didn't log anywhere else
        const warnLogFile = getLogFileByType("warn");
        expect(warnLogFile).toBeTruthy();
        expect(getNumLines(warnLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the info log didn't log anywhere else
        const accessLogFile = getLogFileByType("access");
        expect(accessLogFile).toBeTruthy();
        expect(getNumLines(accessLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the info log didn't log anywhere else
        const errorLogFile = getLogFileByType("error");
        expect(errorLogFile).toBeTruthy();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should properly log at debug level", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "debug");
        const logger = new Logger(cfgProvider);
        await runLogs(logger);

        expect(numberOfFiles()).toBe(5);
        const logFile = getLogFileByType("debug");
        expect(logFile).toBeTruthy();
        expect(getNumLines(logFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const infoLogFile = getLogFileByType("info");
        expect(infoLogFile).toBeTruthy();
        expect(getNumLines(infoLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const warnLogFile = getLogFileByType("warn");
        expect(warnLogFile).toBeTruthy();
        expect(getNumLines(warnLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const accessLogFile = getLogFileByType("access");
        expect(accessLogFile).toBeTruthy();
        expect(getNumLines(accessLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const errorLogFile = getLogFileByType("error");
        expect(errorLogFile).toBeTruthy();
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

        await runLogs(logger);

        expect(numberOfFiles()).toBe(5);
        function testHasData(fileName: string) {
            const logFile = getLogFileByType(fileName);
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
            expect(parsed).toBeTruthy();
            expect(parsed).toHaveProperty("data");
            expect(parsed.data).toHaveProperty("foo");
            expect(parsed.data.foo).toBe("bar");
        }

        testHasData("error");
        testHasData("access");
        testHasData("warn");
        testHasData("info");
        testHasData("debug");
    });

    it("Should log with name", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "debug");
        const logger = new Logger(cfgProvider, "TestName");

        await runLogs(logger);

        expect(numberOfFiles()).toBe(5);
        function testHasName(fileName: string) {
            const logFile = getLogFileByType(fileName);
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
            expect(parsed).toBeTruthy();
            const msg = parsed.message;
            // the string should being with [TestName]
            expect(msg.startsWith(`[${logger.getName()}]`)).toBe(true);
        }

        testHasName("error");
        testHasName("access");
        testHasName("warn");
        testHasName("info");
        testHasName("debug");
    });

    it("should create a new named log from an existing log", async () => {
        cfgProvider.set("log_location", logDirectory);
        cfgProvider.set("log_level", "debug");
        const logger = new Logger(cfgProvider);
        const namedLogger = logger.getNamedLogger("TestName");
        expect(namedLogger.getName()).toBe("TestName");
        await runLogs(namedLogger);
    });
});
