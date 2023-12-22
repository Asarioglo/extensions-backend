import winston from "winston";

export enum LogLevels {
    Error = "error",
    HTTP = "http",
    Warn = "warn",
    Info = "info",
    Debug = "debug",
}

export const CustomLevels = {
    levels: {
        error: 0,
        http: 1,
        warn: 2,
        info: 3,
        debug: 4,
    },
    colors: {
        error: "red",
        http: "blue",
        warn: "yellow",
        info: "green",
        debug: "brightBlue",
    },
};

export const Filters = {
    [LogLevels.Error]: winston.format((info) => {
        return info.level === "error" ? info : false;
    }),
    [LogLevels.HTTP]: winston.format((info) => {
        return info.level === "http" ? info : false;
    }),
    [LogLevels.Warn]: winston.format((info) => {
        return info.level === "warn" ? info : false;
    }),
    [LogLevels.Info]: winston.format((info) => {
        return info.level === "info" ? info : false;
    }),
    [LogLevels.Debug]: winston.format((info) => {
        return info.level === "debug" ? info : false;
    }),
};
