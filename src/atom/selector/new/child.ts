import type { AtomFamily } from "#src/atom/family/type/AtomFamily.js";
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js";

export type AtomSelector_New_Child_Params<I, V> = {
    readonly index: I
    readonly family: AtomFamily<I, V>
}

export const atomselector_new_child = function <I, V>(
    params: AtomSelector_New_Child_Params<I, V>
): AtomSelectorStatic<V> {
    const { family, index } = params

    return ({ reg }) => {
        return reg(family).reg(index)
    }
}
