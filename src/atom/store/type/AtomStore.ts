import type { AtomAction } from "#src/atom/action/type/AtomAction.js";
import type { AtomValue } from "#src/atom/value/type/AtomValue.js";
import type * as sc from "@qyu/signal-core"

export type AtomStore_EntryChangeEvent<T = any> = (
    | Readonly<{
        type: "post"

        key: AtomValue<T>
        value_next: T
    }>
    | Readonly<{
        type: "delete"

        key: AtomValue<T>
        value_prev: T
    }>
    | Readonly<{
        type: "patch"

        key: AtomValue<T>
        value_prev: T
        value_next: T
    }>
)

export type AtomStore = Readonly<{
    // core
    reg: <T>(atomvalue: AtomValue<T>) => T
    dispatch: (atomaction: AtomAction) => void
    reg_default: <T>(atomvalue: AtomValue<T>, value: T) => T

    // meta actions
    has: (atomvalue: AtomValue) => boolean
    delete: (atomvalue: AtomValue) => void
    set_hard: <T>(atomvalue: AtomValue<T>, value: T) => void
    set_soft: <T>(atomvalue: AtomValue<T>, value: T) => void
    get: <T>(atomvalue: AtomValue<T>) => { result: T } | null

    // meta.trackers
    entries_signal: () => sc.OSignal<[AtomValue, any][]>
    entries_event_change_rmsub: (listener: (action: AtomStore_EntryChangeEvent) => void) => void
    entries_event_change_addsub: (listener: (action: AtomStore_EntryChangeEvent) => void) => void
}>
