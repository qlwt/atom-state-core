import type { AtomRemNode_Def } from "#src/remnode/type/State.js"
import type { ReqState__Status } from "#src/reqstate/type/State.js"

type State_Empty<Def extends AtomRemNode_Def> = {
    readonly status: ReqState__Status.Empty
    readonly data: null

    readonly meta: {
        readonly source: "direct"
        readonly statics: Def["statics"]
    }
}

type State_Pending_Null<Def extends AtomRemNode_Def> = {
    readonly status: ReqState__Status.Pending
    readonly data: null

    readonly meta: {
        readonly source: "direct"
        readonly statics: Def["statics"]
        readonly request: Def["request_meta"]
    }
}

type State_Pending_Optimistic<Def extends AtomRemNode_Def> = {
    readonly status: ReqState__Status.Pending
    readonly data: Def["data"]

    readonly meta: {
        readonly source: "optimistic"
        readonly statics: Def["statics"]
        readonly request: Def["request_meta"]
    }
}

type State_Pending_Fallback<Def extends AtomRemNode_Def> = {
    readonly status: ReqState__Status.Pending
    readonly data: Def["data"]

    readonly meta: {
        readonly source: "fallback"
        readonly statics: Def["statics"]
        readonly request: Def["request_meta"]
    }
}

type State_Fulfilled<Def extends AtomRemNode_Def> = {
    readonly status: ReqState__Status.Fulfilled
    readonly data: Def["data"]

    readonly meta: {
        readonly source: "direct"
        readonly statics: Def["statics"]
    }
}

export type AtomRemNode__Data<Def extends AtomRemNode_Def> = (
    | State_Empty<Def>
    | State_Pending_Null<Def>
    | State_Pending_Fallback<Def>
    | State_Pending_Optimistic<Def>
    | State_Fulfilled<Def>
)

export type AtomRemNode__Data_Full<Def extends AtomRemNode_Def> = (
    | State_Pending_Fallback<Def>
    | State_Pending_Optimistic<Def>
    | State_Fulfilled<Def>
)

export type AtomRemNode__Data_Nullish<Def extends AtomRemNode_Def> = (
    | State_Pending_Fallback<Def>
    | State_Pending_Optimistic<Def>
    | State_Fulfilled<Def>
)

export type AtomRemNode__Data_Pending<Def extends AtomRemNode_Def> = (
    | State_Pending_Null<Def>
    | State_Pending_Fallback<Def>
    | State_Pending_Optimistic<Def>
)

export type AtomRemNode__Data_Pending_Null<Def extends AtomRemNode_Def> = (
    | State_Pending_Null<Def>
)

export type AtomRemNode__Data_Pending_Fallback<Def extends AtomRemNode_Def> = (
    | State_Pending_Fallback<Def>
)

export type AtomRemNode__Data_Pending_Optimistic<Def extends AtomRemNode_Def> = (
    | State_Pending_Optimistic<Def>
)

export type AtomRemNode__Data_Empty<Def extends AtomRemNode_Def> = (
    | State_Empty<Def>
)

export type AtomRemNode__Data_Fulfilled<Def extends AtomRemNode_Def> = (
    | State_Fulfilled<Def>
)
