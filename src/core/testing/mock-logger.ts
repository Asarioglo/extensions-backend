import { ILogger } from "../logging/i-logger";

export default class MockLogger implements ILogger {
    debug = () => {};
    error = () => {};
    info = () => {};
    warn = () => {};
    access = () => {};
}
