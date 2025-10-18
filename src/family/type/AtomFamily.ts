import type { AtomValue } from "#src/value/type/AtomValue.js"
import type * as sc from "@qyu/signal-core"

export type AtomFamily_EntryChangeEvent<V> = (
    | Readonly<{
        type: "post"

        key: unknown
        value_next: V
    }>
    | Readonly<{
        type: "delete"

        key: unknown
        value_prev: V
    }>
    | Readonly<{
        type: "patch"

        key: unknown
        value_prev: V
        value_next: V
    }>
)

export type AtomFamily_Value_Params<P, V> = {
    readonly value: V
    readonly params: P
}

export type AtomFamily_Value<P, V> = Readonly<{
    // core
    reg: (param: P) => V
    reg_default: (param: P, value: V) => V

    // meta
    key: (param: P) => unknown

    // meta.actions
    has: (key: unknown) => boolean
    delete: (key: unknown) => void
    set_hard: (key: unknown, value: V) => void
    set_soft: (key: unknown, value: V) => void
    get: (key: unknown) => { result: V } | null

    // meta.trackers
    entries_signal: () => sc.OSignal<[unknown, V][]>
    entries_event_change_rmsub: (listener: (action: AtomFamily_EntryChangeEvent<V>) => void) => void
    entries_event_change_addsub: (listener: (action: AtomFamily_EntryChangeEvent<V>) => void) => void
}>

export type AtomFamily<P, V> = AtomValue<AtomFamily_Value<P, V>>
