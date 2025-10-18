import { remnode_new } from "#src/remnode/new/index.js"
import type { AtomRemNode, AtomRemNode_Def } from "#src/remnode/type/State.js"
import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js"
import { atomvalue_new } from "#src/value/atom/index.js"

export type AtomRemNode_New_Params<Def extends AtomRemNode_Def> = {
    readonly statics: AtomSelectorStatic<Def["statics"]>
    readonly init: AtomSelectorStatic<Def["data"] | null>
}

export const atomremnode_new = function <Def extends AtomRemNode_Def>(params: AtomRemNode_New_Params<Def>): AtomRemNode<Def> {
    return atomvalue_new(({ reg }) => {
        return remnode_new({
            init: reg(params.init),
            statics: reg(params.statics),
        })
    })
}
