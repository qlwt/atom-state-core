import type { AtomStore } from "#src/store/type/AtomStore.js"
import type * as sc from "@qyu/signal-core"

export type AtomSelectorStatic<T = any> = {
    (store: AtomStore): T
}

export type AtomSelectorDynamic<T = any> = {
    (store: AtomStore): sc.OSignal<T>
}
