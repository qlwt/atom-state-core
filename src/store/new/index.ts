import type { Store, Store_EntryChangeEvent } from "#src/store/type/store.js"
import type { Value_ApiCache_Config, Value_Atom } from "#src/value/type/value.js"
import * as sc from "@qyu/signal-core"

type Node<T> = {
    readonly value: T
    readonly cleanup: VoidFunction | null
}

type Events_Entries = {
    readonly fire: VoidFunction
    readonly signal: sc.OSignal<[Value_Atom, unknown][]>
    readonly subs: Set<(action: Store_EntryChangeEvent<unknown>) => void>
}

const events_new_entries = function(map: Map<Value_Atom, Node<unknown>>): Events_Entries {
    const [esignal, esignal_fire] = sc.esignal_new_manual()

    return {
        subs: new Set(),
        fire: esignal_fire,

        signal: sc.osignal_new_memo({
            ...esignal,

            output: () => {
                const result: [Value_Atom, unknown][] = []

                for (const [k, node] of map.entries()) {
                    result.push([k, node.value])
                }

                return result
            },
        }, null),
    }
}

const events_fire_entries = function(events: Events_Entries, action: Store_EntryChangeEvent<unknown> | null) {
    if (action) {
        sc.batcher.batch_sync(() => {
            events.fire()

            for (const sub of events.subs) {
                sub(action)
            }
        })
    }
}

export const store_new = function(): Store {
    const map = new Map<Value_Atom, Node<unknown>>()

    const events_entries = events_new_entries(map)

    const store: Store = {
        // core
        reg: <T>(atomvalue: Value_Atom<T>): T => {
            {
                const node = map.get(atomvalue)

                if (node) {
                    return node.value as T
                }
            }

            return atomvalue(store, {
                cache: (value, cache_config) => {
                    map.set(atomvalue, {
                        value,

                        cleanup: cache_config?.cleanup ?? null,
                    })

                    events_fire_entries(events_entries, {
                        type: "post",

                        key: atomvalue,
                        value_next: value
                    })
                }
            })
        },

        reg_default: <T>(atomvalue: Value_Atom<T>, value: T, cache_config?: Value_ApiCache_Config): T => {
            const node = map.get(atomvalue)

            if (node) {
                return node.value as T
            }

            {
                map.set(atomvalue, {
                    value,
                    cleanup: cache_config?.cleanup ?? null,
                })

                events_fire_entries(events_entries, {
                    type: "post",

                    key: atomvalue,
                    value_next: value
                })

                return value
            }
        },

        dispatch: (atomaction) => {
            atomaction(store)
        },

        // meta.actions
        has: key => {
            return map.has(key)
        },

        get: <T>(key: Value_Atom<T>) => {
            const node = map.get(key)

            if (node) {
                return { result: node.value as T }
            }

            return null
        },

        delete: <T>(key: Value_Atom<T>) => {
            const node = map.get(key)

            if (node) {
                map.delete(key)

                node.cleanup?.()

                events_fire_entries(events_entries, {
                    type: "delete",

                    key,
                    value_prev: node.value,
                })
            }
        },

        set_soft: (key, value, cache_config) => {
            if (!map.has(key)) {
                map.set(key, {
                    value,
                    cleanup: cache_config?.cleanup ?? null,
                })

                events_fire_entries(events_entries, {
                    type: "post",

                    key: key,
                    value_next: value
                })
            }
        },

        set_hard: (key, value, cache_config) => {
            const oldvalue = map.get(key)

            map.set(key, {
                value,
                cleanup: cache_config?.cleanup ?? null,
            })

            if (oldvalue) {
                oldvalue.cleanup?.()

                events_fire_entries(events_entries, {
                    type: "patch",

                    key: key,
                    value_next: value,
                    value_prev: oldvalue.value,
                })
            } else {
                events_fire_entries(events_entries, {
                    type: "post",

                    key: key,
                    value_next: value
                })
            }
        },

        // meta.trackers
        entries_signal: () => {
            return events_entries.signal
        },

        entries_event_change_rmsub: listener => {
            events_entries.subs.add(listener)
        },

        entries_event_change_addsub: listener => {
            events_entries.subs.delete(listener)
        },
    }

    return store
}
