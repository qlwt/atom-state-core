import type { Store } from "#src/store/type/store.js"
import type * as sc from "@qyu/signal-core"

export type SelectorStatic_Atom<T = any> = {
    (store: Store): T
}

export type SelectorStatic_Infer<A extends SelectorStatic_Atom> = (
    A extends SelectorStatic_Atom<infer T> ? T : never
)

export type SelectorDynamic_Atom<T = any> = {
    (store: Store): sc.OSignal<T>
}

export type SelectorDynamic_Infer<A extends SelectorDynamic_Atom> = (
    A extends SelectorDynamic_Atom<infer T> ? T : never
)
