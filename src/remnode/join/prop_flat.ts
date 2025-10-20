import type { AtomRemNode_Join_Factory } from "#src/remnode/type/Join.js"
import * as sc from "@qyu/signal-core"

export type AtomRemNode_Join_PropFlat_Params<Param, TParam, Result> = Readonly<{
    transformer: (param: Param) => sc.OSignal<TParam>
    source: AtomRemNode_Join_Factory<TParam, Result>
}>

export const atomremnode_join_prop_flat = function <Param, TParam, Result>(
    params: AtomRemNode_Join_PropFlat_Params<Param, TParam, Result>
): AtomRemNode_Join_Factory<sc.OSignal<Param | null>, Result> {
    return ({ reg }) => {
        return key => {
            return sc.osignal_new_memo(sc.osignal_new_pipeflat(key, key_o => {
                if (key_o === null) {
                    return null
                }

                return sc.osignal_new_pipeflat(params.transformer(key_o), key_o_o => {
                    return reg(params.source)(key_o_o)
                })
            }))
        }
    }
}
