import passport from "passport";
import IIDProvider from "../../models/i-id-provider";
import { Router } from "express";
import IProviderRegistry from "../../models/i-provider-registry";

class IDProviderRegistry implements IProviderRegistry {
    private providers: IIDProvider[] = [];

    public registerProvider(provider: IIDProvider): void {
        this.providers.push(provider);
    }

    public deregisterProvider(providerName: string): void {
        this.providers = this.providers.filter(
            (provider) => provider.name !== providerName
        );
    }

    public getProviders(): IIDProvider[] {
        return this.providers;
    }

    public getProviderByName(providerName: string): IIDProvider | null {
        const provider = this.providers.find(
            (provider) => provider.name === providerName
        );
        return provider || null;
    }

    public initialize(
        passportInstance: passport.PassportStatic,
        router: Router
    ): void {
        this.providers.forEach((provider) => {
            provider.initialize(passportInstance, router);
        });
    }
}

export default IDProviderRegistry;
