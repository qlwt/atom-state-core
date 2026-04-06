import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";

type Pointer = {
    value: VoidFunction | null
}

export const throttler_new_microtask = function(): CallBatcher {
    let pointer: Pointer | null = null

    return {
        emit: cb => {
            if (pointer === null) {
                pointer = { value: cb }

                const l_pointer = pointer

                Promise.resolve().then(() => {
                    if (l_pointer.value) {
                        l_pointer.value()

                        l_pointer.value = null

                        pointer = null
                    }
                })
            } else {
                pointer.value = cb
            }
        },

        interrupt: () => {
            if (pointer) {
                const l_pointer = pointer

                pointer = null
                l_pointer.value = null
            }
        },

        status_scheduled_new: () => {
            return pointer !== null
        }
    }
}
