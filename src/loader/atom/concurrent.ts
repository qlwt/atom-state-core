import { loader_new_concurrent } from "#src/loader/new/concurrent.js"
import type { Loader_Atom } from "#src/loader/type/loader.js"
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"
import { value_atom } from "#src/value/atom/index.js"

export type Loader_AtomConcurrent_Params<Param> = {
    readonly callbatcher: CallBatcher
    readonly connect: (params: Param) => VoidFunction
    readonly comparator: (a: Param, b: Param) => number
}

export const loader_atom_concurrent = function <Param>(
    params: SelectorStatic_Atom<Loader_AtomConcurrent_Params<Param>>
): Loader_Atom<Param> {
    return value_atom(({ reg }) => {
        return loader_new_concurrent(reg(params))
    })
}
