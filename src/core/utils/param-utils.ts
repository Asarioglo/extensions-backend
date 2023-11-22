export class ParamUtils {
    static requireParams(
        params: { [key: string]: unknown },
        requiredParams: string[]
    ) {
        for (const param of requiredParams) {
            if (!(param in params)) {
                throw new Error(`Missing required parameter: ${param}`);
            }
        }
    }
}
