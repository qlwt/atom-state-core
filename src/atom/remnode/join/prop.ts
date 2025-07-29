import type { AtomRemNode_Join_Factory } from "#src/atom/remnode/type/Join.js"
import * as sc from "@qyu/signal-core"

export type AtomRemNode_Join_Prop_Params<Param, Result> = Readonly<{
    source: AtomRemNode_Join_Factory<Param, Result>
}>

export const atomremnode_join_prop = function <Param, Result>(
    params: AtomRemNode_Join_Prop_Params<Param, Result>
): AtomRemNode_Join_Factory<sc.OSignal<Param | null>, Result> {
    return ({ reg }) => {
        return key => {
            return sc.osignal_new_memo(sc.osignal_new_pipeflat(key, key_o => {
                if (key_o === null) {
                    return null
                }

                return reg(params.source)(key_o)
            }))
        }
    }
}
