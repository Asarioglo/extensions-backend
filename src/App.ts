import express, { Application, Request, Response } from "express";
import cors from "cors";
import { IConfigProvider } from "./core/models/i-config-provider";
import { IMicroservice } from "./core/models/i-microservice";

type MicroserviceEntry = [route: string, microservice: IMicroservice];

export class App {
    ROUTE_PREFIX: string;
    PORT: string;
    _services: MicroserviceEntry[] = [];
    _express: express.Application | null = null;
    _server: any = null;
    _config: IConfigProvider;

    constructor(configProvider: IConfigProvider) {
        this.PORT = configProvider.get("port", null);
        if (this.PORT === null) {
            throw new Error("PORT must be present in the config provider.");
        }
        this.ROUTE_PREFIX = configProvider.get("route_prefix", "");
        this._config = configProvider;
    }

    addMicroservice(route: string, microservice: IMicroservice) {
        this._services.push([route, microservice]);
    }

    getExpressApp(): Application {
        return this._express;
    }

    _initUtils() {
        //------------ CORS Configuration ------------//
        this._express.use(cors());

        //------------ Bodyparser Configuration ------------//
        this._express.use(express.json());
        this._express.use(express.urlencoded({ extended: false }));
    }

    _initRoutes() {
        console.log(`Initializing routes at prefix ${this.ROUTE_PREFIX}`);
        //------------ Logging ------------//
        this._express.use("/", (req, res, next) => {
            console.log(`[${req.method}] ${req.url}`);
            next();
        });

        //------------ Microservices ------------//
        this._services.forEach(([route, microservice]) => {
            const combined_route = `${this.ROUTE_PREFIX}/${route}`;
            console.log(`Initializing microservice at route ${combined_route}`);
            this._express.use(
                combined_route,
                microservice.launch(this._config)
            );
        });

        //------------ Unhandled Requests ------------//
        this._express.use(`/*`, (req: Request, res: Response) => {
            res.status(404).json({
                message: `Route ${req.url} not found`,
            });
        });
    }

    async init() {
        this._express = express();

        this._initUtils();
        this._initRoutes();

        return new Promise((resolve, reject) => {
            this._server = this._express.listen(this.PORT, () => {
                console.log(`Server is running on port ${this.PORT}`);
                resolve(true);
            });
        });
    }

    async stop() {
        if (this._server === null) {
            return Promise.resolve(true);
        }
        return new Promise((resolve, reject) => {
            this._server?.close(() => {
                this._express = null;
                resolve(true);
            });
        });
    }
}

export default App;
