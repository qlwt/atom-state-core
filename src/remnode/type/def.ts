import type { Family } from "#src/family/type/family.js"
import type { RemOpt } from "#src/remopt/type/remopt.js"
import type { RemState } from "#src/remstate/type/remstate.js"
import type { Value_Atom } from "#src/value/type/value.js"

export type RemNode_Def = {
    readonly data: {}
    readonly statics: {}
    readonly request_meta: any
    readonly request_result: any
}

export type RemNode_InferDef<RN extends RemNode<any>> = (
    RN extends RemNode<infer Def> ? Def : never
)

export type RemNode_Cloner<Data> = {
    (data: Data, cb: (data: Data) => void): Data
}

export type RemNode_Meta<Def extends RemNode_Def> = {
    readonly cloner: (data: Def["data"], cb: (data: Def["data"]) => void) => Def["data"]
}

export type RemNode<Def extends RemNode_Def> = {
    readonly meta: RemNode_Meta<Def>
    readonly statics: Def["statics"]
    readonly optimistic: Family<string, RemOpt<Def["data"]>>
    readonly real: RemState<Def["data"], Def["request_result"], Def["request_meta"]>
}

export type RemNode_Atom<Def extends RemNode_Def> = Value_Atom<RemNode<Def>>
