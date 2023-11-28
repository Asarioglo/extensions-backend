import winston from "winston";

export const CustomLevels = {
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

export const filters = {
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
