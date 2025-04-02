import type { AtomStore } from "#src/atom/store/type/AtomStore.js"
import type { AtomValue } from "#src/atom/value/type/AtomValue.js"

type Entry<T = any> = [AtomValue<T>, T]

export const atomstore_new = function(): AtomStore {
    const map = new Map<AtomValue, unknown>()

    const store: AtomStore = {
        keys: () => {
            return map.keys()
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
