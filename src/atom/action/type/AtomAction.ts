import type { AtomStore } from "#src/atom/store/type/AtomStore.js"

export type AtomAction = {
    (store: AtomStore): void
}
