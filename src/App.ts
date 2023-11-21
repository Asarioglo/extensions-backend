import express, {
    Application,
    Request,
    RequestHandler,
    Response,
} from "express";
import cors from "cors";
import { IConfigProvider } from "./core/models/i-config-provider";
import { IMicroservice } from "./core/models/i-microservice";
import { ILogger } from "./core/logging/i-logger";

type MicroserviceEntry = [route: string, microservice: IMicroservice];

type CustomMiddleware = {
    middleware: RequestHandler;
    route: string;
};

export class App {
    ROUTE_PREFIX: string;
    PORT: string;
    private _services: MicroserviceEntry[] = [];
    private _customMiddlewares: CustomMiddleware[] = [];
    private _express: express.Application | null = null;
    private _server: any = null;
    private _config: IConfigProvider;
    private _state: "INITIALIZED" | "STARTED" | "STOPPED" = "INITIALIZED";
    private _logger: ILogger;

    constructor(configProvider: IConfigProvider, logger: ILogger) {
        this.PORT = configProvider.get("port", null);
        if (this.PORT === null) {
            throw new Error("port must be present in the config provider.");
        }
        this.ROUTE_PREFIX = configProvider.get("route_prefix", "");
        this._config = configProvider;
        this._logger = logger;
    }

    addMicroservice(route: string, microservice: IMicroservice) {
        if (this._state === "STARTED") {
            this._logger.error(
                "Attempted to add microservice after app has been initialized."
            );
            throw new Error(
                "Cannot add microservice after the app has been initialized."
            );
        }
        this._logger.debug(`Adding microservice at route ${route}`);
        this._services.push([route, microservice]);
    }

    addCustomMiddleware(route: string, middleware: RequestHandler) {
        if (this._state === "STARTED") {
            this._logger.error(
                "Attempted to add middleware after app has been initialized."
            );
            throw new Error(
                "Cannot add middleware after the app has been initialized."
            );
        }
        this._logger.debug(`Adding custom middleware at route ${route}`);
        this._customMiddlewares.push({ middleware, route });
    }

    getState() {
        return this._state;
    }

    getExpressApp(): Application {
        return this._express;
    }

    _initUtils() {
        this._logger.debug("Initializing utils");
        //------------ CORS Configuration ------------//
        this._express.use(cors());

        //------------ Bodyparser Configuration ------------//
        this._express.use(express.json());
        this._express.use(express.urlencoded({ extended: false }));
    }

    _initRoutes() {
        this._logger.info(`Initializing routes at prefix ${this.ROUTE_PREFIX}`);
        //------------ Logging ------------//
        this._logger.debug("Initializing request logging");
        this._express.use("/", (req, res, next) => {
            this._logger.access(`[${req.method}] ${req.url}`);
            next();
        });

        //------------ Custom Middlewares ------------//
        this._logger.debug("Initializing custom middlewares", {
            data: { n: this._customMiddlewares.length },
        });
        this._customMiddlewares.forEach(({ route, middleware }) => {
            const combined_route = `${this.ROUTE_PREFIX}/${route}`;
            this._express.use(combined_route, middleware);
        });

        //------------ Microservices ------------//
        this._logger.debug("Initializing microservices", {
            data: { n: this._services.length },
        });
        this._services.forEach(([route, microservice]) => {
            const combined_route = `${this.ROUTE_PREFIX}/${route}`;
            this._express.use(
                combined_route,
                microservice.launch(this._config)
            );
        });

        //------------ Unhandled Requests ------------//
        this._logger.debug("Initializing unhandled requests");
        this._express.use(`/*`, (req: Request, res: Response) => {
            res.status(404).json({
                message: `Route ${req.url} not found`,
            });
        });
    }

    start(): Promise<boolean> {
        if (this._server !== null) {
            this._logger.error("Attempted to start server twice.");
            throw new Error("Server is already running.");
        }

        this._express = express();

        this._initUtils();
        this._initRoutes();

        return new Promise((resolve, reject) => {
            this._server = this._express.listen(this.PORT, () => {
                this._state = "STARTED";
                this._logger.info(`Server is running on port ${this.PORT}`);
                resolve(true);
            });
        });
    }

    stop(): Promise<boolean> {
        if (this._server === null) {
            this._logger.debug("Server is already stopped.");
            return Promise.resolve(true);
        }
        return new Promise((resolve, reject) => {
            this._server?.close(() => {
                this._logger.info("Server stopped.");
                this._state = "STOPPED";
                this._express = null;
                this._server = null;
                resolve(true);
            });
        });
    }
}

export default App;
