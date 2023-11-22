import { format, transports } from "winston";
import Logger from "./logger";

class DevLogger extends Logger {
    protected _getTransports() {
        return [
            new transports.Console({
                level: "debug",
                format: format.combine(format.colorize(), format.simple()),
            }),
        ];
    }
}

export default DevLogger;
