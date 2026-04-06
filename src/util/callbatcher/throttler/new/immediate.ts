import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";

export const throttler_new_immediate = function(): CallBatcher {
    return {
        interrupt: () => {},
        status_scheduled_new: () => false,

        emit: cb => {
            cb()
        },
    }
}
