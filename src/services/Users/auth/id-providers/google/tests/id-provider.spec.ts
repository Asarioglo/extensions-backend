import GoogleIDProvider from "../id-provider";
import passport from "passport";
import IUserRepository from "../../../../database/base/i-user-repository";
import { IConfigProvider } from "../../../../../../core/interfaces/i-config-provider";
import * as express from "express";
import { ConfigProvider } from "../../../../../../core/config/config-provider";

jest.mock("express", () => {
    const mockRouter = {
        get: jest.fn(),
    };
    return {
        Router: () => mockRouter,
    };
});

describe("GoogleIDProvider", () => {
    let userRepo: IUserRepository;
    let config: IConfigProvider;
    let mockPassport: passport.PassportStatic =
        jest.genMockFromModule("passport");
    let mockRouter = express.Router();

    const populateConfig = () => {
        config.set("google_client_id", "client_id");
        config.set("google_client_secret", "client_secret");
        config.set("google_callback_url", "callback_url");
    };

    beforeEach(() => {
        userRepo = {} as IUserRepository;
        config = new ConfigProvider();
        mockPassport = jest.genMockFromModule("passport");
        mockRouter = express.Router();
        populateConfig();
    });

    it("Should throw an error if the config is missing", () => {
        const localConfig = new ConfigProvider();
        expect(() => {
            new GoogleIDProvider(userRepo, localConfig);
        }).toThrow();
        localConfig.set("google_client_id", "client_id");
        expect(() => {
            new GoogleIDProvider(userRepo, localConfig);
        }).toThrow();
        localConfig.set("google_client_secret", "client_secret");
        expect(() => {
            new GoogleIDProvider(userRepo, localConfig);
        }).toThrow();
        localConfig.set("google_callback_url", "callback_url");
        expect(() => {
            new GoogleIDProvider(userRepo, localConfig);
        }).not.toThrow();
    });

    it("should have the correct name", () => {
        const googleIDProvider = new GoogleIDProvider(userRepo, config);
        expect(googleIDProvider.name).toBe("google");
    });

    it("should initialize passport and add strategies", () => {
        const googleIDProvider = new GoogleIDProvider(userRepo, config);

        googleIDProvider.initialize(
            mockPassport as passport.PassportStatic,
            mockRouter
        );

        // Assert that GoogleStrategy is added
        expect(mockPassport.use).toHaveBeenCalledWith(
            "google_main",
            expect.any(Object)
        );
    });

    it("should add login routes", () => {
        const googleIDProvider = new GoogleIDProvider(userRepo, config);

        googleIDProvider.addLoginRoutes(mockRouter);

        // Assert that the login route is added
        expect(mockRouter.get).toHaveBeenCalledWith(
            "/google",
            expect.any(Function)
        );
        // Assert that the login route is added
        expect(mockRouter.get).toHaveBeenCalledWith(
            "/google/callback",
            expect.any(Function), // passport middleware
            expect.any(Function) // handler
        );
    });

    // TODO: Test refreshing
});
