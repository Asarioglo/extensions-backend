export interface IConfigProvider {
    get(key: string, default_value?: any): any;

    set(key: string, value: any): void;
}
