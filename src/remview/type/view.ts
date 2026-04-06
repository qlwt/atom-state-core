import type { RemNode_Def } from "#src/remnode/type/def.js"
import type { ReqState_Status } from "#src/reqstate/type/state.js"

type State_Empty<Def extends RemNode_Def> = {
    readonly status: ReqState_Status.Empty
    readonly data: null

    readonly meta: {
        readonly source: "direct"
        readonly statics: Def["statics"]
        readonly error: null | { readonly value: any }
    }
}

type State_Pending_Null<Def extends RemNode_Def> = {
    readonly status: ReqState_Status.Pending
    readonly data: null

    readonly meta: {
        readonly source: "direct"
        readonly statics: Def["statics"]
        readonly request: Def["request_meta"]
    }
}

type State_Pending_Optimistic<Def extends RemNode_Def> = {
    readonly status: ReqState_Status.Pending
    readonly data: Def["data"]

    readonly meta: {
        readonly source: "optimistic"
        readonly statics: Def["statics"]
        readonly request: Def["request_meta"]
    }
}

type State_Pending_Fallback<Def extends RemNode_Def> = {
    readonly status: ReqState_Status.Pending
    readonly data: Def["data"]

    readonly meta: {
        readonly source: "fallback"
        readonly statics: Def["statics"]
        readonly request: Def["request_meta"]
    }
}

type State_Fulfilled<Def extends RemNode_Def> = {
    readonly status: ReqState_Status.Fulfilled
    readonly data: Def["data"]

    readonly meta: {
        readonly source: "direct"
        readonly statics: Def["statics"]
    }
}

export type RemView<Def extends RemNode_Def> = (
    | State_Empty<Def>
    | State_Pending_Null<Def>
    | State_Pending_Fallback<Def>
    | State_Pending_Optimistic<Def>
    | State_Fulfilled<Def>
)

export type RemView_Full<Def extends RemNode_Def> = (
    | State_Pending_Fallback<Def>
    | State_Pending_Optimistic<Def>
    | State_Fulfilled<Def>
)

export type RemView_Nullish<Def extends RemNode_Def> = (
    | State_Empty<Def>
    | State_Pending_Null<Def>
)

export type RemView_Pending<Def extends RemNode_Def> = (
    | State_Pending_Null<Def>
    | State_Pending_Fallback<Def>
    | State_Pending_Optimistic<Def>
)

export type RemView_PendingNull<Def extends RemNode_Def> = (
    | State_Pending_Null<Def>
)

export type RemView_PendingFallback<Def extends RemNode_Def> = (
    | State_Pending_Fallback<Def>
)

export type RemView_PendingOptimistic<Def extends RemNode_Def> = (
    | State_Pending_Optimistic<Def>
)

export type RemView_PendingFull<Def extends RemNode_Def> = (
    | RemView_PendingFallback<Def>
    | RemView_PendingOptimistic<Def>
)

export type RemView_Empty<Def extends RemNode_Def> = (
    | State_Empty<Def>
)

export type RemView_Fulfilled<Def extends RemNode_Def> = (
    | State_Fulfilled<Def>
)
