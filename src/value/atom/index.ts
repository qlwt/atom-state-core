import type { SelectorStatic_Atom } from "#src/selector/type/selector.js";
import type { Value_Atom } from "#src/value/type/value.js";

export const value_atom = function <T>(get: SelectorStatic_Atom<T>): Value_Atom<T> {
    return (store, api) => {
        const value = get(store)

        api.cache(value)

        return value
    }
}
