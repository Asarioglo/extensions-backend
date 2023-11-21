import { createLogger, format, transports } from "winston";
import Logger from "./logger";

class DevLogger extends Logger {
    protected _getTransports(level: string, location: string) {
        return [
            new transports.Console({
                level: "debug",
                format: format.combine(format.colorize(), format.simple()),
            }),
        ];
    }
}

export default DevLogger;
