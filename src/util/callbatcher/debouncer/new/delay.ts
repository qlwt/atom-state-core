import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";

export const debouncer_new_delay = function(delay: number): CallBatcher {
    let timeout_id: NodeJS.Timeout | null = null

    return {
        emit: cb => {
            // cancel previous call
            if (timeout_id) {
                clearTimeout(timeout_id)
            }

            timeout_id = setTimeout(() => {
                cb()

                timeout_id = null
            }, delay)
        },

        interrupt: () => {
            if (timeout_id) {
                clearTimeout(timeout_id)

                timeout_id = null
            }
        },

        status_scheduled_new: () => {
            return timeout_id !== null
        }
    }
}
