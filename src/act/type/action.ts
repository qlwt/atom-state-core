import type { Store } from "#src/store/type/store.js"

export type Action_Atom = {
    (store: Store): void
}
