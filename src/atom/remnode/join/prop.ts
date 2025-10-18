import type { AtomRemNode_Join_Factory } from "#src/atom/remnode/type/Join.js"
import * as sc from "@qyu/signal-core"

export type AtomRemNode_Join_Prop_Params<Param, TParam, Result> = Readonly<{
    transformer?: (param: Param) => TParam
    source: AtomRemNode_Join_Factory<Param extends never ? Param : TParam, Result>
}>

export const atomremnode_join_prop = function <Param, TParam, Result>(
    params: AtomRemNode_Join_Prop_Params<Param, TParam, Result>
): AtomRemNode_Join_Factory<sc.OSignal<Param | null>, Result> {
    return ({ reg }) => {
        return key => {
            return sc.osignal_new_memo(sc.osignal_new_pipeflat(key, key_o => {
                if (key_o === null) {
                    return null
                }

                if (params.transformer) {
                    return reg(params.source)(params.transformer(key_o) as Param extends never ? Param : TParam)
                }

                return reg(params.source)(key_o as Param extends never ? Param : TParam)
            }))
        }
    }
}
