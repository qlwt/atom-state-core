import type { AtomValue } from "#src/atom/value/type/AtomValue.js"

export type AtomFamily_Value_Params<P extends readonly any[], V> = {
    readonly value: V
    readonly params: P
}

export type AtomFamily_Value<P extends readonly any[], V> = {
    readonly reg: (...params: P) => V
    readonly delete: (...params: P) => void
    readonly reg_default: (...params: P) => (value: V) => V
    readonly set_hard: (...params: P) => (value: V) => void
    readonly set_soft: (...params: P) => (value: V) => void

    readonly has: (key: unknown) => boolean
    readonly keys: () => MapIterator<unknown>
    readonly entries: () => MapIterator<[unknown, V]>
}

export type AtomFamily<P extends readonly any[], V> = AtomValue<AtomFamily_Value<P, V>>
