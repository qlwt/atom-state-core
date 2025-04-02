import type { Throttler } from "#src/throttler/type/Throttler.js";

export const throttler_new_microtask = (): Throttler => {
    return callback => {
        let interrupted = false

        return {
            emit: () => {
                Promise.resolve().then(() => {
                    if (interrupted) { return }

                    callback()
                })
            },

            interrupt: () => {
                interrupted = true
            }
        }
    }
}
