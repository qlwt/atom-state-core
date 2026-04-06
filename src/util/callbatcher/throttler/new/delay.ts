import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";

type Pointer = {
    value: VoidFunction | null
    timeout_id: NodeJS.Timeout | null
}

export const throttler_new_delay = function(delay: number): CallBatcher {
    let pointer: Pointer | null = null

    return {
        emit: cb => {
            if (pointer === null) {
                pointer = { value: cb, timeout_id: null }

                const l_pointer = pointer

                l_pointer.timeout_id = setTimeout(() => {
                    if (l_pointer.value) {
                        l_pointer.value()

                        pointer = null
                        l_pointer.value = null
                    }

                    l_pointer.timeout_id = null
                }, delay)
            } else {
                pointer.value = cb
            }
        },

        interrupt: () => {
            if (pointer) {
                const l_pointer = pointer

                pointer = null
                l_pointer.value = null
                
                if (l_pointer.timeout_id) {
                    clearTimeout(l_pointer.timeout_id)
                }
            }
        },

        status_scheduled_new: () => {
            return pointer !== null
        }
    }
}
