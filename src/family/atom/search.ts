import { family_new_search } from "#src/family/new/search.js"
import type { Family_Atom } from "#src/family/type/family.js"
import type { Family_Prop } from "#src/family/type/prop.js"
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"
import { value_atom } from "#src/value/atom/index.js"

export type Family_AtomSearch_Params<P, V> = {
    readonly comparator: (a: P, b: P) => boolean
    readonly get: (params: P) => Family_Prop<V>
}

export const family_atom_search = function <P, V>(
    params: SelectorStatic_Atom<Family_AtomSearch_Params<P, V>>
): Family_Atom<P, V, P> {
    return value_atom(store => {
        const l_params = store.reg(params)

        return family_new_search({
            comparator: l_params.comparator,
            get: (param, api) => l_params.get(param)(store, api)
        })
    })
}
