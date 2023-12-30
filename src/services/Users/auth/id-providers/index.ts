import GoogleIDProvider from "./google/id-provider";
import IUserRepository from "../../database/base/i-user-repository";
import { IConfigProvider } from "../../../../core/interfaces/i-config-provider";
import IDProviderRegistry from "./id-provider-registry";

export const initIdProviders = (
    configProvider: IConfigProvider,
    userRepo: IUserRepository
) => {
    const registry = new IDProviderRegistry();

    // GOOGLE
    registry.registerProvider(new GoogleIDProvider(userRepo, configProvider));

    // OTHERS HERE

    return registry;
};
