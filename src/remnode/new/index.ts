import { family_new } from "#src/family/new/index.js"
import type { AtomRemNode_Def, AtomRemNode_OptimisticValue, AtomRemNode_Value } from "#src/remnode/type/State.js"
import { remreq_new } from "#src/remreq/new/index.js"
import { remstate_new } from "#src/remstate/new/index.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"

const real_new = function <Def extends AtomRemNode_Def>(init: Def["data"] | null) {
    const value = init

    if (value === null) {
        return reqstate_new_empty()
    }

    return reqstate_new_fulfilled(value)
}

export type RemNode_New_Params<Def extends AtomRemNode_Def> = ({
    readonly statics: Def["statics"]
    readonly init: Def["data"] | null
})

export const remnode_new = function <Def extends AtomRemNode_Def>(params: RemNode_New_Params<Def>): AtomRemNode_Value<Def> {
    return {
        statics: params.statics,
        real: remstate_new<Def["data"], Def["request_result"], Def["request_meta"]>(real_new(params.init)),

        optimistic: family_new({
            key: (k: string) => k,

            get: (_k: string, cache) => {
                const result = remreq_new<AtomRemNode_OptimisticValue<Def["data"]>>()

                cache(result)

                return result
            }
        }),
    }
}
