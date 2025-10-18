import type { AtomFamily } from "#src/family/type/AtomFamily.js";
import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js";

export type AtomFamily_Sel_Child_Params<I, V> = {
    readonly index: I
    readonly family: AtomFamily<I, V>
}

export const atomfamily_sel_child = function <I, V>(
    params: AtomFamily_Sel_Child_Params<I, V>
): AtomSelectorStatic<V> {
    const { family, index } = params

    return ({ reg }) => {
        return reg(family).reg(index)
    }
}
