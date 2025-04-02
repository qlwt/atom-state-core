import type { AtomValue } from "#src/atom/value/type/AtomValue.js"

export type AtomFamily_Value<P extends readonly any[], V> = {
    readonly reg: (...params: P) => V

    readonly has: (key: unknown) => boolean
    readonly keys: () => MapIterator<unknown>
    readonly entries: () => MapIterator<[unknown, V]>
}

export type AtomFamily<P extends readonly any[], V> = AtomValue<AtomFamily_Value<P, V>>
