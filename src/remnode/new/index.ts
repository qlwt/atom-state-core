import { atomfamily_new } from "#src/family/atom/index.js"
import type { AtomRemNode_Def, AtomRemNode_Value } from "#src/remnode/type/State.js"
import { atomremreq_new } from "#src/remreq/atom/index.js"
import { atomremstate_new } from "#src/remstate/atom/index.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"

export type RemNode_New_Params<Def extends AtomRemNode_Def> = ({
    readonly statics: Def["statics"]
    readonly init: Def["data"] | null
})

export const remnode_new = function <Def extends AtomRemNode_Def>(params: RemNode_New_Params<Def>): AtomRemNode_Value<Def> {
    return {
        statics: params.statics,

        real: atomremstate_new<Def["data"], Def["request_result"], Def["request_meta"]>(() => {
            const value = params.init

            if (value === null) {
                return reqstate_new_empty()
            }

            return reqstate_new_fulfilled(value)
        }),

        optimistic: atomfamily_new({
            key: (k: string) => k,
            get: (_k: string) => atomremreq_new()
        }),
    }
}
