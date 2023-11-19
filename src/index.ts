import App from "./App";
import { ConfigFactory } from "./core/config/config-factory";
import dotenv from "dotenv";
import { UsersService } from "./services/Users";

dotenv.config();

const config = ConfigFactory.create(process.env.NODE_ENV);

const app = new App(config);
app.addMicroservice("users", new UsersService());

app.init().then(() => {
    console.log("App initialization complete.");
});
