import { IConfigProvider } from "./i-config-provider";

export interface IMicroservice {
    launch: (config: IConfigProvider) => any;
}
