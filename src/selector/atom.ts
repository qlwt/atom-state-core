import type { SelectorStatic_Atom } from "#src/selector/type/selector.js";
import type { Store } from "#src/store/type/store.js";

export const selector_atom = function <T>(gen: (store: Store) => T): SelectorStatic_Atom<T> {
    return gen
}
