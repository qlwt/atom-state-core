import type { AtomStore, AtomStore_EntryChangeEvent } from "#src/store/type/AtomStore.js"
import type { AtomValue } from "#src/value/type/AtomValue.js"
import * as sc from "@qyu/signal-core"

export const atomstore_new = function(): AtomStore {
    const map = new Map<AtomValue, unknown>()
    const [mapchange_event, mapchange_event_fire] = sc.esignal_new_manual()

    const map_entries = sc.osignal_new_memo({
        ...mapchange_event,

        output: () => {
            return [...map.entries()]
        },
    })

    const events_entry_change = new Array<(action: AtomStore_EntryChangeEvent) => void>()

    const store: AtomStore = {
        // core
        reg: <T>(atomvalue: AtomValue<T>): T => {
            if (map.has(atomvalue)) {
                return map.get(atomvalue) as T
            }

            return atomvalue(store, value => {
                map.set(atomvalue, value)

                sc.batcher.batch_sync(() => {
                    mapchange_event_fire()

                    events_entry_change.map(event => {
                        event({
                            type: "post",

                            key: atomvalue,
                            value_next: value
                        })
                    })
                })
            })
        },

        reg_default: <T>(atomvalue: AtomValue<T>, value: T): T => {
            if (!map.has(atomvalue)) {
                map.set(atomvalue, value)

                sc.batcher.batch_sync(() => {
                    mapchange_event_fire()

                    events_entry_change.map(event => {
                        event({
                            type: "post",

                            key: atomvalue,
                            value_next: value
                        })
                    })
                })

                return value
            }

            return map.get(atomvalue) as T
        },

        dispatch: (atomaction) => {
            atomaction(store)
        },

        // meta.actions
        has: key => {
            return map.has(key)
        },

        get: <T>(key: AtomValue<T>) => {
            if (map.has(key)) {
                return { result: map.get(key)! as T }
            }

            return null
        },

        delete: <T>(key: AtomValue<T>) => {
            if (map.has(key)) {
                const value = map.get(key)!

                map.delete(key)

                sc.batcher.batch_sync(() => {
                    mapchange_event_fire()

                    events_entry_change.map(event => {
                        event({
                            type: "delete",

                            key: key,
                            value_prev: value
                        })
                    })
                })
            } else {
                map.delete(key)
            }
        },

        set_soft: (key, value) => {
            if (!map.has(key)) {
                map.set(key, value)

                sc.batcher.batch_sync(() => {
                    mapchange_event_fire()

                    events_entry_change.map(event => {
                        event({
                            type: "post",

                            key: key,
                            value_next: value
                        })
                    })
                })
            }
        },

        set_hard: (key, value) => {
            const hadvalue = map.has(key)
            const oldvalue = map.get(key)

            map.set(key, value)

            sc.batcher.batch_sync(() => {
                mapchange_event_fire()

                if (hadvalue) {
                    events_entry_change.map(event => {
                        event({
                            type: "patch",

                            key: key,
                            value_next: value,
                            value_prev: oldvalue!,
                        })
                    })
                } else {
                    events_entry_change.map(event => {
                        event({
                            type: "post",

                            key: key,
                            value_next: value
                        })
                    })
                }
            })
        },

        // meta.trackers
        entries_signal: () => {
            return map_entries
        },

        entries_event_change_rmsub: listener => {
            const index = events_entry_change.indexOf(listener)

            if (index !== -1) {
                events_entry_change.splice(index, 1)
            }
        },

        entries_event_change_addsub: listener => {
            events_entry_change.push(listener)
        },
    }

    return store
}
