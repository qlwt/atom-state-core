import type { AtomFamily } from "#src/family/type/AtomFamily.js"
import type { AtomRemReq_Value } from "#src/remreq/type/State.js"
import type { AtomRemState } from "#src/remstate/type/AtomRemote.js"
import type { AtomValue } from "#src/value/type/AtomValue.js"

export type AtomRemNode_OptimisticValue<Data> = (
    | ((data: Data) => Data | undefined | void)
    | Partial<Data>
)

export type AtomRemNode_Def = Readonly<{
    data: {}
    statics: {}
    request_meta: any
    request_result: any
}>

export type AtomRemNode_Value<Def extends AtomRemNode_Def> = {
    readonly statics: Def["statics"]

    readonly real: AtomRemState<Def["data"], Def["request_result"], Def["request_meta"]>

    readonly optimistic: AtomFamily<
        string,
        AtomRemReq_Value<
            AtomRemNode_OptimisticValue<Def["data"]>
        >
    >
}

export type AtomRemNode<Def extends AtomRemNode_Def> = AtomValue<AtomRemNode_Value<Def>>
