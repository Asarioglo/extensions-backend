import * as express from "express";
import { App } from "../App";
import { ConfigFactory } from "../core/config/config-factory";
import { UsersService } from "../services/Users";

export default class IntegrationHelpers {
    public static appInstance: App;

    public static async getApp(): Promise<App> {
        if (this.appInstance) {
            return this.appInstance;
        }
        const config = ConfigFactory.create("test");
        const app: App = new App(config);

        app.addMicroservice("users", new UsersService());

        await app.init();

        this.appInstance = app;

        return app;
    }

    public static getConfig() {
        const config = ConfigFactory.create("test");
        return config;
    }
}
