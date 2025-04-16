import type { AtomStore } from "#src/atom/store/type/AtomStore.js"
import type { AtomValue } from "#src/atom/value/type/AtomValue.js"

type Entry<T = any> = [AtomValue<T>, T]

export const atomstore_new = function(): AtomStore {
    const map = new Map<AtomValue, unknown>()

    const store: AtomStore = {
        keys: () => {
            return map.keys()
        },

        delete: atomvalue => {
            map.delete(atomvalue)
        },

        set_hard: (atomvalue, value) => {
            map.set(atomvalue, value)
        },

        set_soft: (atomvalue, value) => {
            if (!map.has(atomvalue)) {
                map.set(atomvalue, value)
            }
        },

        reg_default: <T>(atomvalue: AtomValue<T>, value: T): T => {
            if (!map.has(atomvalue)) {
                map.set(atomvalue, value)

                return value
            }

            return map.get(atomvalue) as T
        },

        entries: () => {
            return map.entries() as MapIterator<Entry>
        },

        has: atomvalue => {
            return map.has(atomvalue)
        },

        reg: <T>(atomvalue: AtomValue<T>): T => {
            if (map.has(atomvalue)) {
                return map.get(atomvalue) as T
            }

            return atomvalue(store, value => { map.set(atomvalue, value) })
        }
    }

    return store
}
