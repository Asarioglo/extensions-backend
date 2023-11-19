export namespace ParamUtils {
    export function requireParams(params: any, requiredParams: string[]) {
        for (let param of requiredParams) {
            if (!(param in params)) {
                throw new Error(`Missing required parameter: ${param}`);
            }
        }
    }
}
