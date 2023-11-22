import winston, {
    createLogger,
    transports,
    format,
    Logger as WinstonLogger,
} from "winston";
import * as Transport from "winston-transport";
import { ILogger } from "./i-logger";
import { IConfigProvider } from "../interfaces/i-config-provider";
import path from "path";
import os from "os";

const CustomLevels = {
    levels: {
        error: 0,
        access: 1,
        warn: 2,
        info: 3,
        debug: 4,
    },
    colors: {
        error: "red",
        access: "blue",
        warn: "yellow",
        info: "green",
        debug: "brightBlue",
    },
};

const filters = {
    error: winston.format((info) => {
        return info.level === "error" ? info : false;
    }),
    access: winston.format((info) => {
        return info.level === "access" ? info : false;
    }),
    warn: winston.format((info) => {
        return info.level === "warn" ? info : false;
    }),
    info: winston.format((info) => {
        return info.level === "info" ? info : false;
    }),
    debug: winston.format((info) => {
        return info.level === "debug" ? info : false;
    }),
};

class Logger implements ILogger {
    _logger: WinstonLogger;

    constructor(config: IConfigProvider) {
        // singleton constructor
        const level = config.get("log_level", "error");
        const userHome = os.homedir();
        const location = config.get(
            "log_location",
            path.join(userHome, "ext-backend", "logs")
        );
        this._logger = createLogger({
            levels: CustomLevels.levels,
            level,
            transports: this._getTransports(level, location),
        });
        winston.addColors(CustomLevels.colors);
    }

    public error = (msg: string, ...args: unknown[]) => {
        this._logger.error(msg, ...args);
    };

    public access = (msg: string, ...args: unknown[]) => {
        this._logger.log("access", msg, ...args);
    };

    public warn = (msg: string, ...args: unknown[]) => {
        this._logger.warn(msg, ...args);
    };

    public info = (msg: string, ...args: unknown[]) => {
        this._logger.info(msg, ...args);
    };

    public debug = (msg: string, ...args: unknown[]) => {
        this._logger.debug(msg, ...args);
    };

    protected _getTransports(level: string, location: string) {
        const myTransports: Transport[] = [
            new transports.File({
                level: "error",
                filename: path.join(location, "error.log"),
                format: format.combine(
                    filters.error(),
                    format.timestamp(),
                    format.json()
                ),
            }),
        ];
        if (CustomLevels.levels[level] >= CustomLevels.levels["access"]) {
            myTransports.push(
                new transports.File({
                    level: "access",
                    filename: path.join(location, "access.log"),
                    format: format.combine(
                        filters.access(),
                        format.timestamp(),
                        format.json()
                    ),
                })
            );
        }
        if (CustomLevels.levels[level] >= CustomLevels.levels["warn"]) {
            myTransports.push(
                new transports.File({
                    level: "warn",
                    filename: path.join(location, "warn.log"),
                    format: format.combine(
                        filters.warn(),
                        format.timestamp(),
                        format.json()
                    ),
                })
            );
        }
        if (CustomLevels.levels[level] >= CustomLevels.levels["info"]) {
            myTransports.push(
                new transports.File({
                    level: "info",
                    filename: path.join(location, "info.log"),
                    format: format.combine(
                        filters.info(),
                        format.timestamp(),
                        format.json()
                    ),
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
                    ),
                })
            );
            myTransports.push(
                new transports.File({
                    level: "debug",
                    filename: path.join(location, "debug.log"),
                    format: format.combine(
                        filters.debug(),
                        format.timestamp(),
                        format.json()
                    ),
                })
            );
        }
        return myTransports;
    }
}

export default Logger;
