import type { AtomFamily } from "#src/atom/family/type/AtomFamily.js"
import type { AtomRemReq_Value } from "#src/atom/remreq/type/State.js"
import type { AtomRemState } from "#src/atom/remstate/type/AtomRemote.js"
import type { AtomValue } from "#src/atom/value/type/AtomValue.js"

export type AtomRemNode_Def = Readonly<{
    data: {}
    statics: {}
    request_meta: any
    request_result: any
}>

export type AtomRemNode_Value<Def extends AtomRemNode_Def> = {
    readonly statics: Def["statics"]

    readonly optimistic: AtomFamily<string, AtomRemReq_Value<Partial<Def["data"]>>>
    readonly real: AtomRemState<Def["data"], Def["request_result"], Def["request_meta"]>
}

export type AtomRemNode<Def extends AtomRemNode_Def> = AtomValue<AtomRemNode_Value<Def>>
