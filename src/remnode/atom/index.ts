import { remnode_new } from "#src/remnode/new/index.js"
import type { RemNode_Atom, RemNode_Def, RemNode_Meta } from "#src/remnode/type/def.js"
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"
import { value_atom } from "#src/value/atom/index.js"

export type RemNode_Atom_Params<Def extends RemNode_Def> = {
    readonly statics: Def["statics"]
    readonly init: Def["data"] | null
    readonly meta?: RemNode_Meta<Def>
}

export const remnode_atom = function <Def extends RemNode_Def>(params: SelectorStatic_Atom<RemNode_Atom_Params<Def>>): RemNode_Atom<Def> {
    return value_atom(({ reg }) => {
        return remnode_new(reg(params))
    })
}
