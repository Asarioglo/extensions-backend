import DailyRotateFile from "winston-daily-rotate-file";
import { Filters, LogLevels } from "./config";
import * as Transport from "winston-transport";
import path from "path";
import winston, { transports, format } from "winston";

export enum TransportTypes {
    DailyRotateFile,
    Console,
    Void,
}

const dummyFilter = winston.format((msg) => msg);
const emptyFilter = winston.format((msg) => false);

export class TransportFactory {
    public static createTransport(
        type: TransportFactory,
        level: LogLevels,
        logDir: string,
        restrictToLevel: boolean = true
    ) {
        let transport: Transport;
        switch (type) {
            case TransportTypes.DailyRotateFile:
                transport = new DailyRotateFile({
                    level,
                    filename: path.join(logDir, `${level}-%DATE%.log`),
                    format: format.combine(
                        restrictToLevel ? Filters[level]() : dummyFilter(),
                        format.timestamp(),
                        format.json()
                    ),
                    maxSize: "20m",
                    maxFiles: "14d",
                    datePattern: "YYYY-MM-DD",
                });
                break;
            case TransportTypes.Void:
                transport = new transports.Console({
                    level,
                    format: format.combine(emptyFilter()),
                });
                break;
            case TransportTypes.Console:
            default:
                transport = new transports.Console({
                    level,
                    format: format.combine(
                        restrictToLevel ? Filters[level]() : dummyFilter(),
                        format.colorize(),
                        format.simple()
                    ),
                });
        }

        transport.setMaxListeners(100);

        return transport;
    }
}
