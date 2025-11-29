import type { AtomAction } from "#src/action/type/AtomAction.js";
import type { AtomValue } from "#src/value/type/AtomValue.js";
import type * as sc from "@qyu/signal-core"

export type AtomStore_EntryChangeEvent<T = any> = (
    | {
        readonly type: "post"

        readonly key: AtomValue<T>
        readonly value_next: T
    }
    | {
        readonly type: "delete"

        readonly key: AtomValue<T>
        readonly value_prev: T
    }
    | {
        readonly type: "patch"

        readonly key: AtomValue<T>
        readonly value_prev: T
        readonly value_next: T
    }
)

export type AtomStore = {
    // core
    readonly reg: <T>(atomvalue: AtomValue<T>) => T
    readonly dispatch: (atomaction: AtomAction) => void
    readonly reg_default: <T>(atomvalue: AtomValue<T>, value: T) => T

    // meta actions
    readonly has: (atomvalue: AtomValue) => boolean
    readonly delete: (atomvalue: AtomValue) => void
    readonly set_hard: <T>(atomvalue: AtomValue<T>, value: T) => void
    readonly set_soft: <T>(atomvalue: AtomValue<T>, value: T) => void
    readonly get: <T>(atomvalue: AtomValue<T>) => { result: T } | null

    // meta.trackers
    readonly entries_signal: () => sc.OSignal<[AtomValue, any][]>
    readonly entries_event_change_rmsub: (listener: (action: AtomStore_EntryChangeEvent) => void) => void
    readonly entries_event_change_addsub: (listener: (action: AtomStore_EntryChangeEvent) => void) => void
}
