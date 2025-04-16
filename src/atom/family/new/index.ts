import type { AtomFamily } from "#src/atom/family/type/AtomFamily.js";
import { atomvalue_new } from "#src/atom/value/new/index.js";
import type { AtomValue } from "#src/atom/value/type/AtomValue.js";

export type AtomFamily_New_Params<P extends readonly unknown[], V> = {
    readonly get: (...params: P) => AtomValue<V>
    readonly key: (...params: P) => unknown
}

export const atomfamily_new = function <P extends readonly unknown[], V>(
    params: AtomFamily_New_Params<P, V>
): AtomFamily<P, V> {
    const map = new Map<unknown, V>

    return atomvalue_new(store => {
        return {
            has: key => {
                return map.has(key)
            },

            keys: () => {
                return map.keys()
            },

            entries: () => {
                return map.entries()
            },

            reg: (...reg_params: P) => {
                const key = params.key(...reg_params)

                if (map.has(key)) {
                    return map.get(key)!
                }

                return params.get(...reg_params)(store, value => {
                    map.set(key, value)
                })
            },

            delete: (...reg_params: P) => {
                map.delete(params.key(...reg_params))
            },

            set_soft: (...reg_params: P) => (value: V) => {
                const key = params.key(...reg_params)

                if (!map.has(key)) {
                    map.set(key, value)
                }
            },

            set_hard: (...reg_params: P) => (value: V) => {
                map.set(params.key(...reg_params), value)
            },

            reg_default: (...reg_params: P) => (value: V) => {
                const key = params.key(...reg_params)

                if (map.has(key)) {
                    return map.get(key) as V
                }

                map.set(key, value)

                return value
            },
        }
    })
}
