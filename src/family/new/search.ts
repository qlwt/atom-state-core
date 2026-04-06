import type { Family, Family_EntryChangeEvent } from "#src/family/type/family.js"
import type { Family_Prop_Api, Family_Prop_ApiCache_Config } from "#src/family/type/prop.js"
import * as sc from "@qyu/signal-core"

type Node<V> = {
    readonly value: V
    readonly cleanup: VoidFunction | null
}

type Events_Entries<P, V> = {
    readonly fire: VoidFunction
    readonly signal: sc.OSignal<[P, V][]>
    readonly subs: Set<(action: Family_EntryChangeEvent<P, V>) => void>
}

const events_new_entries = function <P, V>(entries: [P, Node<V>][]): Events_Entries<P, V> {
    const [esignal, esignal_fire] = sc.esignal_new_manual()

    return {
        subs: new Set(),
        fire: esignal_fire,

        signal: sc.osignal_new_memo({
            ...esignal,

            output: () => {
                const result: [P, V][] = []

                for (const [k, node] of entries) {
                    result.push([k, node.value])
                }

                return result
            },
        }, null),
    }
}

const events_fire_entries = function <P, V>(events: Events_Entries<P, V>, action: Family_EntryChangeEvent<P, V> | null) {
    if (action) {
        sc.batcher.batch_sync(() => {
            events.fire()

            for (const sub of events.subs) {
                sub(action)
            }
        })
    }
}

export type Family_NewSearch_Params<P, V> = {
    readonly comparator: (a: P, b: P) => boolean
    readonly get: (params: P, api: Family_Prop_Api<V>) => V
}

export const family_new_search = function <P, V>(
    params: Family_NewSearch_Params<P, V>
): Family<P, V, P> {
    const entries = new Array<[P, Node<V>]>()
    const events_entries = events_new_entries(entries)

    const result: Family<P, V, P> = {
        // core
        reg: (reg_param: P) => {
            for (const [entry_p, entry_node] of entries) {
                if (params.comparator(entry_p, reg_param)) {
                    return entry_node.value
                }
            }

            return params.get(reg_param, {
                cache: (value, cache_config) => {
                    entries.push([reg_param, {
                        value,
                        cleanup: cache_config?.cleanup ?? null,
                    }])

                    events_fire_entries(events_entries, {
                        type: "post",

                        key: reg_param,
                        value_next: value,
                    })
                }
            })
        },

        reg_default: (reg_param: P, value: V, cache_config?: Family_Prop_ApiCache_Config) => {
            for (const [entry_p, entry_node] of entries) {
                if (params.comparator(entry_p, reg_param)) {
                    return entry_node.value
                }
            }

            {
                entries.push([reg_param, {
                    value,
                    cleanup: cache_config?.cleanup ?? null,
                }])

                events_fire_entries(events_entries, {
                    type: "post",

                    key: reg_param,
                    value_next: value,
                })

                return value
            }
        },

        // meta
        key: (param) => {
            return param
        },

        // meta.actions
        has: key => {
            for (const [entry_p] of entries) {
                if (params.comparator(entry_p, key)) {
                    return true
                }
            }

            return false
        },

        get: key => {
            for (const [entry_p, entry_node] of entries) {
                if (params.comparator(entry_p, key)) {
                    return {
                        result: entry_node.value
                    }
                }
            }

            return null
        },

        delete: key => {
            const index = entries.findIndex(([entry_p]) => {
                return params.comparator(key, entry_p)
            })

            if (index !== -1) {
                const [entry_p, entry_node] = entries[index]!

                entries.splice(index, 1)

                entry_node.cleanup?.()

                events_fire_entries(events_entries, {
                    type: "delete",
                    key: entry_p,
                    value_prev: entry_node.value,
                })
            }
        },

        set_soft: (key, value, cache_config) => {
            for (const [entry_p] of entries) {
                if (params.comparator(entry_p, key)) {
                    return
                }
            }

            {
                entries.push([key, {
                    value,
                    cleanup: cache_config?.cleanup ?? null,
                }])

                events_fire_entries(events_entries, {
                    type: "post",

                    key,
                    value_next: value,
                })
            }
        },

        set_hard: (key, value, cache_config) => {
            const index = entries.findIndex(([entry_p]) => {
                return params.comparator(key, entry_p)
            })

            entries.push([key, {
                value,
                cleanup: cache_config?.cleanup ?? null,
            }])

            if (index !== -1) {
                const oldnode = entries[index]![1]

                entries.splice(index, 1)

                oldnode.cleanup?.()

                events_fire_entries(events_entries, {
                    type: "patch",

                    key,
                    value_next: value,
                    value_prev: oldnode.value,
                })
            } else {
                events_fire_entries(events_entries, {
                    type: "post",

                    key,
                    value_next: value,
                })
            }
        },

        // meta.trackers
        entries_signal: () => {
            return events_entries.signal
        },

        entries_event_change_rmsub: listener => {
            events_entries.subs.delete(listener)
        },

        entries_event_change_addsub: listener => {
            events_entries.subs.add(listener)
        },
    }

    return result
}
