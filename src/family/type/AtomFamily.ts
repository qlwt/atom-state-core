import type { AtomValue } from "#src/value/type/AtomValue.js"
import type * as sc from "@qyu/signal-core"

export type AtomFamily_EntryChangeEvent<V> = (
    | {
        readonly type: "post"

        readonly key: unknown
        readonly value_next: V
    }
    | {
        readonly type: "delete"

        readonly key: unknown
        readonly value_prev: V
    }
    | {
        readonly type: "patch"

        readonly key: unknown
        readonly value_prev: V
        readonly value_next: V
    }
)

export type AtomFamily_Value_Params<P, V> = {
    readonly value: V
    readonly params: P
}

export type AtomFamily_Value<P, V> = {
    // core
    readonly reg: (param: P) => V
    readonly reg_default: (param: P, value: V) => V

    // meta
    readonly key: (param: P) => unknown

    // meta.actions
    readonly has: (key: unknown) => boolean
    readonly delete: (key: unknown) => void
    readonly set_hard: (key: unknown, value: V) => void
    readonly set_soft: (key: unknown, value: V) => void
    readonly get: (key: unknown) => { result: V } | null

    // meta.trackers
    readonly entries_signal: () => sc.OSignal<[unknown, V][]>
    readonly entries_event_change_rmsub: (listener: (action: AtomFamily_EntryChangeEvent<V>) => void) => void
    readonly entries_event_change_addsub: (listener: (action: AtomFamily_EntryChangeEvent<V>) => void) => void
}

export type AtomFamily<P, V> = AtomValue<AtomFamily_Value<P, V>>
