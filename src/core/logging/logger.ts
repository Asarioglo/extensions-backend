import path from "path";
import os from "os";
import { TransportFactory, TransportTypes } from "./transport-factory";
import { CustomLevels, LogLevels } from "./config";
import { ILogger } from "./i-logger";
import winston from "winston";
import { mkdirp } from "mkdirp";

export default class Logger {
    public static logDirectory: string = path.join(
        os.homedir(),
        "ext-backend",
        "logs"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static transports: any[] = [];
    public static level = LogLevels.Error;
    public static defaultTransportType = TransportTypes.Console;
    private static _configured: boolean = false;
    private static _container: winston.Container = new winston.Container();

    /**
     * If the logger with the given label does not exist, it will be created.
     * If the Logger statics such as transports and level are not configured
     * prior to this call, it will default to a console transport with the debug level.
     */
    public static getLogger(label: string): ILogger {
        if (!Logger._configured) {
            Logger._initialize();
        }
        if (Logger.transports.length === 0) {
            Logger.addTransport(TransportTypes.Console, LogLevels.Debug, false);
        }
        if (!Logger._container.has(label)) {
            Logger._container.add(label, {
                levels: CustomLevels.levels,
                level: Logger.level,
                format: winston.format.combine(
                    winston.format.label({ label })
                    // winston.format.colorize(),
                    // winston.format.printf(({ data, level, message }) => {
                    //     return `${level}: [${label}] ${message} ${
                    //         data ? JSON.stringify(data) : ""
                    //     }`;
                    // })
                ),
                transports: Logger.transports,
            });
        }
        const logger = Logger._container.get(label) as ILogger;
        // // eslint-disable-next-line
        // (logger as any)._log = (logger as any).log;
        // // eslint-disable-next-line
        // (logger as any).log = (
        //     level: LogLevels,
        //     msg: string,
        //     ...args: unknown[]
        // ) => {
        //     console.log("logging data !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        //     // eslint-disable-next-line
        //     (logger as any)._log(level, msg, ...args);
        // };
        return logger;
    }

    private static _initialize() {
        winston.addColors(CustomLevels.colors);
        mkdirp.sync(Logger.logDirectory);
        Logger._configured = true;
    }

    public static setLogDirectory(dir: string) {
        Logger.logDirectory = dir;
        mkdirp.sync(Logger.logDirectory);
    }

    public static setDefaultTransportType(type: TransportTypes) {
        Logger.defaultTransportType = type;
    }

    /**
     * Will add all necessary transports up to this level. If a transport type
     * is not explicitly provided, it will be taken from Logger.defaultTransportType.
     */
    public static setLevel(level: LogLevels, transportType?: TransportTypes) {
        if (!Logger._configured) {
            Logger._initialize();
        }
        const levelPriority = CustomLevels.levels[level];
        const neededLevels = Object.keys(CustomLevels.levels).filter(
            (key) => CustomLevels.levels[key] <= levelPriority
        );
        Logger.resetLogger();
        neededLevels.forEach((neededLevel) => {
            Logger.addTransport(
                transportType || Logger.defaultTransportType,
                neededLevel as LogLevels,
                true
            );
        });
        Logger.level = level;
    }

    public static resetLogger() {
        Logger.transports = [];
        this._container.close();
        Logger._container = new winston.Container();
    }

    public static addTransport(
        type: TransportTypes,
        level: LogLevels,
        restrictToLevel?: boolean
    ) {
        if (!Logger._configured) {
            Logger._initialize();
        }
        Logger.transports.push(
            TransportFactory.createTransport(
                type,
                level,
                Logger.logDirectory,
                restrictToLevel
            )
        );
    }
}
