import Fuse from "fuse.js"
import env from "../../env";

export default class RoyalGapFrontendUtil {
    static mergePathParam(path , params) {
        for(const param in params) {
            path = path.replaceAll(`:${param}` , params[param])
        }

        return path
    }

    static GetMatchSearch(options , { keys = [], threshold }) {
        return new Fuse(options, {
            keys: keys,
            threshold: threshold,
        })
    }

    static withSubpath(src) {
        return env.subpath_server + src;
    }
}