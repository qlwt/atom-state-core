import type { Family_Atom } from "#src/family/type/family.js";
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js";

export type Family_SelChild_Params<I, V> = {
    readonly index: I
    readonly family: Family_Atom<I, V>
}

export const family_sel_child = function <I, V>(
    params: Family_SelChild_Params<I, V>
): SelectorStatic_Atom<V> {
    const { family, index } = params

    return ({ reg }) => {
        return reg(family).reg(index)
    }
}
