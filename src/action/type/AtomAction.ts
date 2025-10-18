import type { AtomStore } from "#src/store/type/AtomStore.js"

export type AtomAction = {
    (store: AtomStore): void
}
