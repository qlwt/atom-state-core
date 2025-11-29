import type { AtomRemNode_Join, AtomRemNode_Join_Factory, AtomRemNode_Join_Required } from "#src/remnode/type/Join.js"
import * as sc from "@qyu/signal-core"

export const atomremnode_join_required = function <Param, JoinRaw extends AtomRemNode_Join<any, any>>(
    source: AtomRemNode_Join_Factory<Param, JoinRaw | null>
): AtomRemNode_Join_Factory<Param, AtomRemNode_Join_Required<JoinRaw>> {
    return ({ reg }) => {
        return key => {
            const a = reg(source)(key)

            return sc.osignal_new_pipe(a, a_o => {
                if (a_o === null) { return null }
                if (a_o.data === null) { return null }

                return a_o as AtomRemNode_Join_Required<JoinRaw>
            })
        }
    }
}
