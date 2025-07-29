import type { AtomRemNode_Join_Factory } from "#src/atom/remnode/type/Join.js"
import * as sc from "@qyu/signal-core"

export type AtomRemNode_Join_Array_Params<Param, Result> = Readonly<{
    source: AtomRemNode_Join_Factory<Param, Result>
}>

export const atomremnode_join_array = function <Param, Result>(
    params: AtomRemNode_Join_Array_Params<Param, Result>
): AtomRemNode_Join_Factory<sc.OSignal<readonly Param[] | null>, Result[]> {
    return ({ reg }) => {
        return keys => {
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
