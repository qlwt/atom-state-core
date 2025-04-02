import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js";
import type { AtomValue } from "#src/atom/value/type/AtomValue.js";

export const atomvalue_new = function <T>(get: AtomSelectorStatic<T>): AtomValue<T> {
    return (store, cache) => {
        const value = get(store)

        cache(value)

        return value
    }
}
