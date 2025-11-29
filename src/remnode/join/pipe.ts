import type { AtomRemNode_Join_Factory } from "#src/remnode/type/Join.js"

export type AtomRemNode_Join_Pipe_Params<Param, TParam, Result> = {
    readonly transformer: (param: Param) => TParam
    readonly source: AtomRemNode_Join_Factory<TParam, Result>
}

export const atomremnode_join_pipe = function <Param, TParam, Result>(
    params: AtomRemNode_Join_Pipe_Params<Param, TParam, Result>
): AtomRemNode_Join_Factory<Param, Result> {
    return ({ reg }) => {
        return key => {
            return reg(params.source)(params.transformer(key))
        }
    }
}
