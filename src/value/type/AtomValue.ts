import type { AtomStore } from "#src/store/type/AtomStore.js";

export type AtomValue<T = any> = {
    (store: AtomStore, cache: (value: T) => void): T
}
