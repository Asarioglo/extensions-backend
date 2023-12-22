/**
 * @jest-environment ./src/core/testing/test-env-with-config.ts
 */

import { IConfigProvider } from "../core/interfaces/i-config-provider";
import Logger from "../core/logging/logger";
import fs from "fs";
import path from "path";
import os from "os";
import { ILogger } from "../core/logging/i-logger";
import { LogLevels } from "../core/logging/config";
import { transports } from "winston";
import { TransportTypes } from "../core/logging/transport-factory";

async function runLogs(logger: ILogger, timeout: number = 500) {
    return new Promise((resolve) => {
        logger.error("Test logging error", {
            data: { foo: "bar" },
        });
        logger.http("Test logging access", {
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
    const logDirectory = path.join(os.homedir(), "ext-backend", "logs-test");
    let logFiles: string[] | null = null;
    let debutLogger: ILogger;

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

    beforeAll(() => {
        Logger.setLogDirectory(logDirectory);
        debutLogger = globalThis.__logger;
    });

    beforeEach(() => {
        configProvider = globalThis.__configProvider as IConfigProvider;
        // to stop the assigned but not used error
        configProvider.get("log_location", logDirectory);
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
    it("Should default to logger level with console transport", async () => {
        const logger = Logger.getLogger("Test_default_logger");
        await runLogs(logger);
        expect(Logger.transports.length).toBe(1);
        expect(Logger.transports[0] instanceof transports.Console).toBe(true);
        expect(Logger.transports[0].level).toBe(LogLevels.Debug);
    });

    it("Logger.setLevel() should add transports correctly", async () => {
        Logger.setLevel(LogLevels.Error);
        expect(Logger.transports.length).toBe(1);
        expect(Logger.transports[0] instanceof transports.Console).toBe(true);
        expect(Logger.transports[0].level).toBe(LogLevels.Error);

        Logger.defaultTransportType = TransportTypes.DailyRotateFile;
        Logger.setLevel(LogLevels.Warn);
        expect(Logger.transports.length).toBe(3);
        expect(Logger.transports[0] instanceof transports.DailyRotateFile).toBe(
            true
        );
        expect(Logger.transports[0].level).toBe(LogLevels.Error);
        expect(Logger.transports[1] instanceof transports.DailyRotateFile).toBe(
            true
        );
        expect(Logger.transports[1].level).toBe(LogLevels.HTTP);

        expect(Logger.transports[2] instanceof transports.DailyRotateFile).toBe(
            true
        );
        expect(Logger.transports[2].level).toBe(LogLevels.Warn);
    });

    it("Should properly log at debug level", async () => {
        Logger.setDefaultTransportType(TransportTypes.DailyRotateFile);
        Logger.setLevel(LogLevels.Debug);
        const logger = Logger.getLogger("Test_debug_level");
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
        const accessLogFile = getLogFileByType("http");
        expect(accessLogFile).toBeTruthy();
        expect(getNumLines(accessLogFile!)).toBe(2); // 2 lines because of empty line at the end

        // make sure the debug log didn't log anywhere else
        const errorLogFile = getLogFileByType("error");
        expect(errorLogFile).toBeTruthy();
        expect(getNumLines(errorLogFile!)).toBe(2);
    });

    it("Should log with data and label", async () => {
        Logger.setDefaultTransportType(TransportTypes.DailyRotateFile);
        Logger.setLevel(LogLevels.Debug);
        const logger_name = "Test_debug_level";
        const logger = Logger.getLogger(logger_name);

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
            expect(lines[0].indexOf(logger_name)).toBeGreaterThan(-1);
            const parsed = JSON.parse(lines[0]);
            expect(parsed).toBeTruthy();
            expect(parsed).toHaveProperty("data");
            expect(parsed.data).toHaveProperty("foo");
            expect(parsed.data.foo).toBe("bar");
        }

        testHasData("error");
        testHasData("http");
        testHasData("warn");
        testHasData("info");
        testHasData("debug");
    });
});
