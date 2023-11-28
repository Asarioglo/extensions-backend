import winston, { transports, format, Logger as WinstonLogger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import * as Transport from "winston-transport";
import { ILogger } from "./i-logger";
import { IConfigProvider } from "../interfaces/i-config-provider";
import path from "path";
import os from "os";
import { CustomLevels, filters } from "./config";

class Logger implements ILogger {
    private _logger: WinstonLogger;
    private _name: string = "";
    private _configProvider: IConfigProvider;
    private static _transports: Transport[] | null = null;

    constructor(config: IConfigProvider, name: string = "default") {
        // singleton constructor
        const level = config.get("log_level", "error");
        const userHome = os.homedir();
        const location = config.get(
            "log_location",
            path.join(userHome, "ext-backend", "logs")
        );
        this._name = name;
        this._configProvider = config;

        if (!Logger._transports) {
            Logger._transports = this._getTransports(level, location);
        }
        winston.addColors(CustomLevels.colors);

        if (!winston.loggers.has(this._name)) {
            winston.loggers.add(this._name, {
                levels: CustomLevels.levels,
                level,
                transports: Logger._transports,
            });
        }
        this._logger = winston.loggers.get(this._name);
    }

    // private static _consoleLogFormatTemplate(i: {
    //     level: string;
    //     message: string;
    //     [key: string]: unknown;
    // }) {
    //     return `[${i.label}] ${i.level}: ${i.message}`;
    // }

    private _buildMessage(msg: string) {
        if (this._name) {
            return `[${this._name}] ${msg}`;
        }
        return msg;
    }

    public getName = () => {
        return this._name;
    };

    public error = (msg: string, ...args: unknown[]) => {
        this._logger.error(this._buildMessage(msg), ...args);
    };

    public access = (msg: string, ...args: unknown[]) => {
        this._logger.log("access", this._buildMessage(msg), ...args);
    };

    public warn = (msg: string, ...args: unknown[]) => {
        this._logger.warn(this._buildMessage(msg), ...args);
    };

    public info = (msg: string, ...args: unknown[]) => {
        this._logger.info(this._buildMessage(msg), ...args);
    };

    public debug = (msg: string, ...args: unknown[]) => {
        this._logger.debug(this._buildMessage(msg), ...args);
    };

    getNamedLogger(name: string) {
        return new Logger(this._configProvider, name);
    }

    protected _getTransports(level: string, location: string) {
        const dailyRotateParams = {
            maxSize: "20m",
            maxFiles: "14d",
            datePattern: "YYYY-MM-DD",
        };
        const myTransports: Transport[] = [
            new DailyRotateFile({
                level: "error",
                filename: path.join(location, "error-%DATE%.log"),
                format: format.combine(
                    filters.error(),
                    format.timestamp(),
                    format.json()
                ),
                ...dailyRotateParams,
            }),
        ];
        if (CustomLevels.levels[level] >= CustomLevels.levels["access"]) {
            myTransports.push(
                new DailyRotateFile({
                    level: "access",
                    filename: path.join(location, "access-%DATE%.log"),
                    format: format.combine(
                        filters.access(),
                        format.timestamp(),
                        format.json()
                    ),
                    ...dailyRotateParams,
                })
            );
        }
        if (CustomLevels.levels[level] >= CustomLevels.levels["warn"]) {
            myTransports.push(
                new DailyRotateFile({
                    level: "warn",
                    filename: path.join(location, "warn-%DATE%.log"),
                    format: format.combine(
                        filters.warn(),
                        format.timestamp(),
                        format.json()
                    ),
                    ...dailyRotateParams,
                })
            );
        }
        if (CustomLevels.levels[level] >= CustomLevels.levels["info"]) {
            myTransports.push(
                new DailyRotateFile({
                    level: "info",
                    filename: path.join(location, "info-%DATE%.log"),
                    format: format.combine(
                        filters.info(),
                        format.timestamp(),
                        format.json()
                    ),
                    ...dailyRotateParams,
                })
            );
        }
        if (CustomLevels.levels[level] >= CustomLevels.levels["debug"]) {
            myTransports.push(
                new transports.Console({
                    level: "debug",
                    format: format.combine(
                        filters.debug(),
                        format.colorize(),
                        format.simple()
                        // format.printf(Logger._consoleLogFormatTemplate)
                    ),
                })
            );
            myTransports.push(
                new DailyRotateFile({
                    level: "debug",
                    filename: path.join(location, "debug-%DATE%.log"),
                    format: format.combine(
                        filters.debug(),
                        format.timestamp(),
                        format.json()
                    ),
                    ...dailyRotateParams,
                })
            );
        }
        return myTransports;
    }
}

export default Logger;
