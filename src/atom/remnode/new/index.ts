import { atomfamily_new } from "#src/atom/family/new/index.js"
import type { AtomRemNode, AtomRemNode_Def } from "#src/atom/remnode/type/State.js"
import { atomremreq_new } from "#src/atom/remreq/new/index.js"
import { atomremstate_new } from "#src/atom/remstate/new/index.js"
import type { AtomStore } from "#src/atom/store/type/AtomStore.js"
import { atomvalue_new } from "#src/atom/value/new/index.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"

export type AtomRemNode_New_Params<Def extends AtomRemNode_Def> = ({
    readonly statics: () => Def["statics"]
    readonly init: (store: AtomStore) => Def["data"] | null
})

export const atomremnode_new = function <Def extends AtomRemNode_Def>(params: AtomRemNode_New_Params<Def>): AtomRemNode<Def> {
    return atomvalue_new(({ reg }) => {
        return {
            statics: params.statics(),

            real: atomremstate_new<Def["data"], Def["request_result"], Def["request_meta"]>(() => {
                const value = reg(params.init)

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
    })
}
