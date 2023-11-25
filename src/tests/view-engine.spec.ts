/**
 * @jest-environment ./src/core/testing/test-env-with-express-app.ts
 */

/**
 * Note that this test is relying on the view and asset files to be copied to
 * dist/ folder. The behavior is configured in jest.config.ts where the copy-views.js
 * is mentioned.
 */
import supertest from "supertest";
import { IConfigProvider } from "../core/interfaces/i-config-provider";
import App from "../App";
import { StatusCodes } from "http-status-codes";
import path from "path";

describe("View Engine", () => {
    let app!: App;
    let configProvider: IConfigProvider;
    let uri_prefix!: string;

    beforeEach(async () => {
        app = globalThis.__app;
        configProvider = globalThis.__configProvider;
        uri_prefix = configProvider.get("route_prefix", "") as string;
    });

    afterEach(async () => {
        await app.stop();
    });

    it("should register path with view", async () => {
        app.addCustomMiddleware("test-view", (req, res) => {
            res.render("pages/unit-test.ejs");
        });
        await app.start();

        await supertest(app.getExpressApp())
            .get(path.join(uri_prefix, "test-view"))
            .expect(StatusCodes.OK)
            .expect("Content-Type", /html/);
    });

    it("should fill the layout with head and body", async () => {
        app.addCustomMiddleware("test-layout-compilation", (req, res) => {
            res.render("pages/unit-test.ejs");
        });
        await app.start();

        const response = await supertest(app.getExpressApp())
            .get(path.join(uri_prefix, "test-layout-compilation"))
            .expect(StatusCodes.OK)
            .expect("Content-Type", /html/);

        expect(response.text).toContain("head-partial-inserted");
        expect(response.text).toContain("layout-before-head-applied");
        expect(response.text).toContain("layout-after-head-applied");
        expect(response.text).toContain("layout-before-body-applied");
        expect(response.text).toContain("layout-after-body-applied");
        expect(response.text).toContain("body-of-unittest-inserted");
    });

    it("should render default variables when not provided", async () => {
        app.addCustomMiddleware("test-default-variables", (req, res) => {
            res.render("pages/unit-test.ejs");
        });
        await app.start();

        const response = await supertest(app.getExpressApp())
            .get(path.join(uri_prefix, "test-default-variables"))
            .expect(StatusCodes.OK)
            .expect("Content-Type", /html/);

        expect(response.text).toContain("default-body-test-variable");
        expect(response.text).toContain("Default Popup Window");
    });

    it("should inject variables when provided", async () => {
        app.addCustomMiddleware("test-custom-variables", (req, res) => {
            res.render("pages/unit-test.ejs", {
                title: "Custom Title",
                body_test_variable: "Custom Body Test Variable",
            });
        });
        await app.start();

        const response = await supertest(app.getExpressApp())
            .get(path.join(uri_prefix, "test-custom-variables"))
            .expect(StatusCodes.OK)
            .expect("Content-Type", /html/);

        expect(response.text).toContain("Custom Body Test Variable");
        expect(response.text).toContain("Custom Title");
    });

    it("should apply different layout", async () => {
        app.addCustomMiddleware("test-different-layout", (req, res) => {
            res.render("pages/unit-test.ejs", {
                layout: "layouts/test-layout",
            });
        });
        await app.start();

        const response = await supertest(app.getExpressApp())
            .get(path.join(uri_prefix, "test-different-layout"))
            .expect(StatusCodes.OK)
            .expect("Content-Type", /html/);

        expect(response.text).toContain("test-layout-applied");
        expect(response.text).toContain("body-of-unittest-inserted");
    });
});
