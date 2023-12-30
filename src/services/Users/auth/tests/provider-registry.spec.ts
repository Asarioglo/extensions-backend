/**
 * @jest-environment ./src/core/testing/test-env-with-config.ts
 */

import { Router } from "express";
import IProviderRegistry from "../../models/i-provider-registry";
import IDProviderRegistry from "../id-providers/id-provider-registry";
import { MockIDProvider } from "./mocks";
import passport from "passport";

describe("ProviderRegistry", () => {
    let providerRegistry: IProviderRegistry | null;

    beforeEach(() => {
        providerRegistry = new IDProviderRegistry();
    });

    afterEach(() => {
        providerRegistry = null;
    });

    it("Should register a provider and get it by name", () => {
        providerRegistry?.registerProvider(new MockIDProvider("test_provider"));
        const providers = providerRegistry?.getProviders();
        expect(providers).toBeTruthy();
        expect(providers?.length).toBe(1);
        providerRegistry?.registerProvider(
            new MockIDProvider("test_provider2")
        );
        expect(providers?.length).toBe(2);
        const provider = providerRegistry?.getProviderByName("test_provider");
        expect(provider).toBeTruthy();
        expect(provider?.name).toBe("test_provider");
    });

    it("Should initialize providers", () => {
        providerRegistry?.registerProvider(new MockIDProvider("test_provider"));
        providerRegistry?.registerProvider(
            new MockIDProvider("test_provider2")
        );
        const passport = {};
        const router = {};
        providerRegistry?.initialize(
            passport as passport.PassportStatic,
            router as Router
        );
        const provider = providerRegistry?.getProviderByName("test_provider");
        expect(provider).toBeTruthy();
        expect(provider?.initialize).toHaveBeenCalledWith(passport, router);
        const provider1 = providerRegistry?.getProviderByName("test_provider2");
        expect(provider1).toBeTruthy();
        expect(provider1?.initialize).toHaveBeenCalledWith(passport, router);
    });
});
