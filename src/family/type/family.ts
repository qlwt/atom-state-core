import type { Family_Prop_ApiCache_Config } from "#src/family/type/prop.js"
import type { Value_Atom } from "#src/value/type/value.js"
import type * as sc from "@qyu/signal-core"

export type Family_EntryChangeEvent_Post<K, V> = {
    readonly type: "post"

    readonly key: K
    readonly value_next: V
}

export type Family_EntryChangeEvent_Delete<K, V> = {
    readonly type: "delete"

    readonly key: K
    readonly value_prev: V
}

export type Family_EntryChangeEvent_Patch<K, V> = {
    readonly type: "patch"

    readonly key: K
    readonly value_prev: V
    readonly value_next: V
}

export type Family_EntryChangeEvent<K, V> = (
    | Family_EntryChangeEvent_Post<K, V>
    | Family_EntryChangeEvent_Delete<K, V>
    | Family_EntryChangeEvent_Patch<K, V>
)

export type Family_Params<P, V> = {
    readonly value: V
    readonly params: P
}

export type Family<P, V, K = unknown> = {
    // core
    readonly reg: (param: P) => V
    readonly reg_default: (param: P, value: V, cache_config?: Family_Prop_ApiCache_Config) => V

    // meta
    readonly key: (param: P) => K

    // meta.actions
    readonly has: (key: K) => boolean
    readonly delete: (key: K) => void
    readonly get: (key: K) => { result: V } | null
    readonly set_hard: (key: K, value: V, cache_config?: Family_Prop_ApiCache_Config) => void
    readonly set_soft: (key: K, value: V, cache_config?: Family_Prop_ApiCache_Config) => void

    // meta.trackers
    readonly entries_signal: () => sc.OSignal<[K, V][]>
    readonly entries_event_change_rmsub: (listener: (action: Family_EntryChangeEvent<K, V>) => void) => void
    readonly entries_event_change_addsub: (listener: (action: Family_EntryChangeEvent<K, V>) => void) => void
}

export type Family_Atom<P, V, K = unknown> = Value_Atom<Family<P, V, K>>
