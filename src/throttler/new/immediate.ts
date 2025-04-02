import type { Throttler } from "#src/throttler/type/Throttler.js";

export const throttler_new_immediate = (): Throttler => {
    return callback => ({
        emit: () => {
            callback()
        },

        interrupt: () => { }
    })
}
