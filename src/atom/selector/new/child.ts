import type { AtomFamily } from "#src/atom/family/type/AtomFamily.js";
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js";

export type AtomSelector_New_Child_Params<P extends readonly unknown[], V> = {
    readonly params: P
    readonly family: AtomFamily<P, V>
}

export const atomselector_new_child = function <P extends readonly unknown[], V>(
    params: AtomSelector_New_Child_Params<P, V>
): AtomSelectorStatic<V> {
    const { family, params: family_params } = params

    return store => {
        return store.reg(family).reg(...family_params)
    }
}
