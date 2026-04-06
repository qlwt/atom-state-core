import { loader_new_pure } from "#src/loader/new/pure.js";
import type { Loader_Atom } from "#src/loader/type/loader.js";
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js";
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";
import { value_atom } from "#src/value/atom/index.js";

export type Loader_AtomPure_Params = {
    readonly callbatcher: CallBatcher
    readonly connect: () => VoidFunction
}

export const loader_atom_pure = function(params: SelectorStatic_Atom<Loader_AtomPure_Params>): Loader_Atom<void> {
    return value_atom(({ reg }) => {
        return loader_new_pure(reg(params))
    })
}
