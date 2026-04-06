import type { Action_Atom } from "#src/act/type/action.js";
import type { Value_ApiCache_Config, Value_Atom } from "#src/value/type/value.js";
import type * as sc from "@qyu/signal-core"

export type Store_EntryChangeEvent_Patch<T = any> = {
    readonly type: "patch"

    readonly key: Value_Atom<T>
    readonly value_prev: T
    readonly value_next: T
}

export type Store_EntryChangeEvent_Delete<T = any> = {
    readonly type: "delete"

    readonly key: Value_Atom<T>
    readonly value_prev: T
}

export type Store_EntryChangeEvent_Post<T = any> = {
    readonly type: "post"

    readonly key: Value_Atom<T>
    readonly value_next: T
}

export type Store_EntryChangeEvent<T = any> = (
    | Store_EntryChangeEvent_Post<T>
    | Store_EntryChangeEvent_Patch<T>
    | Store_EntryChangeEvent_Delete<T>
)

export type Store = {
    // core
    readonly dispatch: (atomaction: Action_Atom) => void
    readonly reg: <T>(atomvalue: Value_Atom<T>) => T
    readonly reg_default: <T>(atomvalue: Value_Atom<T>, value: T, config?: Value_ApiCache_Config) => T

    // meta actions
    readonly has: (atomvalue: Value_Atom) => boolean
    readonly delete: (atomvalue: Value_Atom) => void
    readonly get: <T>(atomvalue: Value_Atom<T>) => { result: T } | null
    readonly set_hard: <T>(atomvalue: Value_Atom<T>, value: T, config?: Value_ApiCache_Config) => void
    readonly set_soft: <T>(atomvalue: Value_Atom<T>, value: T, config?: Value_ApiCache_Config) => void

    // meta.trackers
    readonly entries_signal: () => sc.OSignal<[Value_Atom, any][]>
    readonly entries_event_change_rmsub: (listener: (action: Store_EntryChangeEvent) => void) => void
    readonly entries_event_change_addsub: (listener: (action: Store_EntryChangeEvent) => void) => void
}
