import type { AtomRemNode_Join_Factory } from "#src/atom/remnode/type/Join.js"
import * as sc from "@qyu/signal-core"

export type AtomRemNode_Join_Array_Params<Param, TParam extends any[], Result> = Readonly<{
    transformer: (param: Param) => TParam
    source: AtomRemNode_Join_Factory<TParam[number], Result>
}>

export const atomremnode_join_array = function <Param, TParam extends any[], Result>(
    params: AtomRemNode_Join_Array_Params<Param, TParam, Result>
): AtomRemNode_Join_Factory<sc.OSignal<Param | null>, Result[]> {
    return ({ reg }) => {
        return param => {
            const keys = sc.osignal_new_pipe(
                param,
                param_o => {
                    if (param_o === null) {
                        return null
                    }

                    return params.transformer(param_o)
                }
            )

            return sc.osignal_new_memo(
                sc.osignal_new_flat(sc.osignal_new_pipe(
                    sc.osignal_new_listpipe(keys, key_o => {
                        return sc.osignal_new_memo(reg(params.source)(key_o))
                    }),
                    results => {
                        if (results === null) {
                            return null
                        }

                        return sc.osignal_new_pipe(
                            sc.osignal_new_merge(results),
                            n => n.filter(i => i !== null)
                        )
                    }
                ))
            )
        }
    }
}
