import type { Family, Family_EntryChangeEvent } from "#src/family/type/family.js"
import type { Family_Prop_Api, Family_Prop_ApiCache_Config } from "#src/family/type/prop.js"
import * as sc from "@qyu/signal-core"

type Node<V> = {
    readonly value: V
    readonly cleanup: VoidFunction | null
}

type Events_Entries<V> = {
    readonly fire: VoidFunction
    readonly signal: sc.OSignal<[unknown, V][]>
    readonly subs: Set<(action: Family_EntryChangeEvent<unknown, V>) => void>
}

const events_new_entries = function <V>(map: Map<unknown, Node<V>>): Events_Entries<V> {
    const [esignal, esignal_fire] = sc.esignal_new_manual()

    return {
        subs: new Set(),
        fire: esignal_fire,

        signal: sc.osignal_new_memo({
            ...esignal,

            output: () => {
                const result: [unknown, V][] = []

                for (const [k, node] of map.entries()) {
                    result.push([k, node.value])
                }

                return result
            },
        }, null),
    }
}

const events_fire_entries = function <V>(events: Events_Entries<V>, action: Family_EntryChangeEvent<unknown, V> | null) {
    if (action) {
        sc.batcher.batch_sync(() => {
            events.fire()

            for (const sub of events.subs) {
                sub(action)
            }
        })
    }
}

export type Family_NewHash_Params<P, V> = {
    readonly key: (param: P) => unknown
    readonly get: (params: P, api: Family_Prop_Api<V>) => V
}

export const family_new_hash = function <P, V>(
    params: Family_NewHash_Params<P, V>
): Family<P, V, unknown> {
    const map = new Map<unknown, Node<V>>()

    const events_entries = events_new_entries(map)

    const result: Family<P, V, unknown> = {
        // core
        reg: (reg_param: P) => {
            const key = params.key(reg_param)

            if (map.has(key)) {
                return map.get(key)!.value
            }

            const result = params.get(reg_param, {
                cache: (value, cache_config) => {
                    map.set(key, {
                        value,
                        cleanup: cache_config?.cleanup ?? null,
                    })

                    events_fire_entries(events_entries, {
                        type: "post",

                        key,
                        value_next: value,
                    })
                }
            })

            return result
        },

        reg_default: (reg_param: P, value: V, cache_config?: Family_Prop_ApiCache_Config) => {
            const key = params.key(reg_param)

            {
                const node = map.get(key)

                if (node) {
                    return node.value
                }
            }

            {
                map.set(key, {
                    value,
                    cleanup: cache_config?.cleanup ?? null,
                })

                events_fire_entries(events_entries, {
                    type: "post",

                    key,
                    value_next: value,
                })

                return value
            }
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
            const node = map.get(key)

            if (node) {
                return { result: node.value }
            }

            return null
        },

        delete: key => {
            const node = map.get(key)

            if (node) {
                map.delete(key)

                node.cleanup?.()

                events_fire_entries(events_entries, {
                    type: "delete",
                    key: key,
                    value_prev: node.value
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

                    key,
                    value_next: value,
                })
            }
        },

        set_hard: (key, value, cache_config) => {
            const oldnode = map.get(key)

            if (oldnode) {
                oldnode.cleanup?.()

                map.set(key, {
                    value,
                    cleanup: cache_config?.cleanup ?? null,
                })

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
