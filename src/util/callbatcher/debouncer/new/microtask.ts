import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";

type Pointer = {
    value: VoidFunction | null
}

export const debouncer_new_microtask = function(): CallBatcher {
    let pointer: Pointer | null = null

    return {
        emit: cb => {
            // cancel previous call
            if (pointer) {
                pointer.value = null
            }

            pointer = { value: cb }

            const l_pointer = pointer

            Promise.resolve().then(() => {
                if (l_pointer.value) {
                    l_pointer.value()

                    l_pointer.value = null

                    pointer = null
                }
            })
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
