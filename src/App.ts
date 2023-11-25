import express, {
    Application,
    Request,
    RequestHandler,
    Response,
} from "express";
import cors from "cors";
import { IConfigProvider } from "./core/interfaces/i-config-provider";
import { IMicroservice } from "./core/interfaces/i-microservice";
import { ILogger } from "./core/logging/i-logger";
import { Server } from "http";
import path from "path";
import expressLayouts from "express-ejs-layouts";

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
    private _server: Server | null = null;
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

        // ------------ View Engine configuration ------------//
        this._express.set("view engine", "ejs");
        this._express.set("views", "dist/views");
        this._express.use(expressLayouts);
        this._express.set("layout", "layouts/popup");
        // This is relative to the dist. Assets are copied there by the copy-static.js
        // script in the root.
        this._express.use("/assets", express.static("dist/assets"));
        // this._express.use("/assets-index", serveIndex(path.join(__dirname)));

        // ------------ Server Info Page ------------//
        this._express.use("/about", (req, res) => {
            res.render("pages/about", {
                title: "About",
                layout: "layouts/popup",
            });
        });
        this._express.get("/test-view", (req, res) => {
            res.render("pages/unit-test.ejs");
        });
    }

    async _initRoutes() {
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
            const combined_route = path.join(this.ROUTE_PREFIX, route);
            this._express.use(combined_route, middleware);
        });

        //------------ Microservices ------------//
        this._logger.debug("Initializing microservices", {
            data: { n: this._services.length },
        });
        for (const [route, microservice] of this._services) {
            const combined_route = path.join(this.ROUTE_PREFIX, route);
            this._express.use(
                combined_route,
                await microservice.launch(
                    this._express,
                    this._config,
                    this._logger
                )
            );
        }

        //------------ Unhandled Requests ------------//
        this._logger.debug("Initializing unhandled requests");
        this._express.use(`/*`, (req: Request, res: Response) => {
            res.status(404).json({
                message: `Route ${req.url} not found`,
            });
        });
    }

    async start(): Promise<boolean> {
        if (this._server !== null) {
            this._logger.error("Attempted to start server twice.");
            throw new Error("Server is already running.");
        }

        this._express = express();

        this._initUtils();
        await this._initRoutes();

        return await new Promise((resolve, reject) => {
            try {
                this._server = this._express.listen(this.PORT, () => {
                    this._state = "STARTED";
                    this._logger.info(`Server is running on port ${this.PORT}`);
                    resolve(true);
                });
            } catch (err) {
                this._logger.error("Failed to start server", {
                    error: err,
                });
                reject(err);
            }
        });
    }

    async stop(): Promise<boolean> {
        if (this._server === null) {
            this._logger.debug("Server is already stopped.");
            return Promise.resolve(true);
        }
        return await new Promise((resolve, reject) => {
            try {
                this._server?.close(() => {
                    this._logger.info("Server stopped.");
                    this._state = "STOPPED";
                    this._express = null;
                    this._server = null;
                    resolve(true);
                });
            } catch (err) {
                this._logger.error("Failed to stop server", {
                    error: err,
                });
                reject(err);
            }
        });
    }
}

export default App;
