import type { AtomRemNode_Def } from "#src/atom/remnode/type/State.js"
import type { ReqState__Status } from "#src/reqstate/type/State.js"

type State_Empty<Def extends AtomRemNode_Def> = Readonly<{
    status: ReqState__Status.Empty
    data: null

    meta: {
        source: "direct"
    }
}>

type State_Pending_Null<Def extends AtomRemNode_Def> = Readonly<{
    status: ReqState__Status.Pending
    data: null

    meta: {
        source: "direct"
    }
}>

type State_Pending_Optimistic<Def extends AtomRemNode_Def> = Readonly<{
    status: ReqState__Status.Pending
    data: Def["data"]

    meta: {
        source: "optimistic"
    }
}>

type State_Pending_Fallback<Def extends AtomRemNode_Def> = Readonly<{
    status: ReqState__Status.Pending
    data: Def["data"]

    meta: {
        source: "fallback"
    }
}>

type State_Fulfilled<Def extends AtomRemNode_Def> = Readonly<{
    status: ReqState__Status.Fulfilled
    data: Def["data"]

    meta: {
        source: "direct"
    }
}>

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
