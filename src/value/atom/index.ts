import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js";
import type { AtomValue } from "#src/value/type/AtomValue.js";

export const atomvalue_new = function <T>(get: AtomSelectorStatic<T>): AtomValue<T> {
    return (store, cache) => {
        const value = get(store)

        cache(value)

        return value
    }
}
