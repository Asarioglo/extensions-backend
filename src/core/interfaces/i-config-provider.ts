export interface IConfigProvider {
    get(key: string, default_value?: string): string | null;

    set(key: string, value: string): void;
}
