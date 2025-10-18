import type { AtomFamily_EntryChangeEvent, AtomFamily_Value } from "#src/family/type/AtomFamily.js"
import * as sc from "@qyu/signal-core"

export type Family_New_Params<P, V> = Readonly<{
    get: (params: P, cache: (value: V) => void) => V
    key: (params: P) => unknown
}>

export const family_new = function <P, V>(
    params: Family_New_Params<P, V>
): AtomFamily_Value<P, V> {
    const map = new Map<unknown, V>
    const [mapchange_event, mapchange_event_fire] = sc.esignal_new_manual()

    const map_entries = sc.osignal_new_memo({
        ...mapchange_event,

        output: () => {
            return [...map.entries()]
        },
    })

    const events_entry_change = new Array<(action: AtomFamily_EntryChangeEvent<V>) => void>()

    return {
        // core
        reg: (reg_param: P) => {
            const key = params.key(reg_param)

            if (map.has(key)) {
                return map.get(key)!
            }

            const result = params.get(reg_param, value => {
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
            })

            return result
        },

        reg_default: (reg_param: P, value: V) => {
            const key = params.key(reg_param)

            if (map.has(key)) {
                return map.get(key) as V
            }

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

            return value
        },

        // meta
        key: (param) => {
            return params.key(param)
        },

        // meta.actions
        has: key => {
            return map.has(key)
        },

        get: key => {
            if (map.has(key)) {
                return { result: map.get(key)! }
            }

            return null
        },

        delete: key => {
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
}
