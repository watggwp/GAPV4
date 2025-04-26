export default class RoyalGapUtil {
    static mergePathParam(path , params) {
        for(const param in params) {
            path = path.replaceAll(`:${param}` , params[param])
        }

        return path
    }
}