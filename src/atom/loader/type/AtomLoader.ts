import type { AtomValue } from "#src/atom/value/type/AtomValue.js"

export type AtomLoader_Value<P extends readonly unknown[]> = {
    readonly request: (...params: P) => VoidFunction
}

export type AtomLoader<P extends readonly unknown[] = any[]> = AtomValue<AtomLoader_Value<P>>
