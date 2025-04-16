import type { AtomValue } from "#src/atom/value/type/AtomValue.js";

type Entry<T = any> = [AtomValue<T>, T]

export type AtomStore = {
    readonly reg: <T>(atomvalue: AtomValue<T>) => T
    readonly delete: (atomvalue: AtomValue) => void
    readonly reg_default: <T>(atomvalue: AtomValue<T>, value: T) => T
    readonly set_hard: <T>(atomvalue: AtomValue<T>, value: T) => void
    readonly set_soft: <T>(atomvalue: AtomValue<T>, value: T) => void

    readonly has: (atomvalue: AtomValue) => boolean
    readonly entries: () => MapIterator<Entry>
    readonly keys: () => MapIterator<AtomValue>
}
