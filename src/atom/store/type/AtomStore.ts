import type { AtomValue } from "#src/atom/value/type/AtomValue.js";

type Entry<T = any> = [AtomValue<T>, T]

export type AtomStore = {
    readonly reg: <T>(atomvalue: AtomValue<T>) => T

    readonly has: (atomvalue: AtomValue) => boolean
    readonly entries: () => MapIterator<Entry>
    readonly keys: () => MapIterator<AtomValue>
}
