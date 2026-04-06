import { family_new_hash } from "#src/family/new/hash.js"
import type { Family_Atom } from "#src/family/type/family.js"
import type { Family_Prop } from "#src/family/type/prop.js"
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"
import { value_atom } from "#src/value/atom/index.js"

export type Family_AtomHash_Params<P, V> = {
    readonly key: (params: P) => unknown
    readonly get: (params: P) => Family_Prop<V>
}

export const family_atom_hash = function <P, V>(
    params: SelectorStatic_Atom<Family_AtomHash_Params<P, V>>
): Family_Atom<P, V> {
    return value_atom(store => {
        const l_params = store.reg(params)

        return family_new_hash({
            key: l_params.key,

            get: (param, api) => l_params.get(param)(store, api)
        })
    })
}
