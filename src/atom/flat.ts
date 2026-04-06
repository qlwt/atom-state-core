import type { Store } from "#src/store/type/store.js";
import type { Value_Atom } from "#src/value/type/value.js";

export const atom_flat = function <T>(src: (store: Store) => Value_Atom<T>): Value_Atom<T> {
    return ({ reg }) => {
        return reg(reg(src))
    }
}
