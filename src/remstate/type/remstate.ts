import type { ReqState, ReqState_Empty, ReqState_Fulfilled, ReqState_Pending, ReqState_Pending_Fallback, ReqState_Pending_Optimistic, } from "#src/reqstate/type/state.js";
import type { Value_Atom } from "#src/value/type/value.js";
import type * as sc from "@qyu/signal-core";

export type RemState_MessageSetHard<T, PR, PM> = {
    readonly status: "set-hard"
    readonly reqstate: ReqState<T, PR, PM>
}

export interface RemState_MessagePushPending<T, PR, PM> extends ReqState_Pending<T, PR, PM> {
    readonly meta: PM
    readonly signal_abort?: AbortSignal
    readonly fallback: null | ReqState_Pending_Fallback<T>
    readonly optimistic: null | ReqState_Pending_Optimistic<T>

    readonly request_abort: VoidFunction
    readonly request_promise: Promise<PR>
    readonly request_interpret: (result: PR) => RemState_MessagePush<T, PR, PM>
}

export interface RemState_MessagePushFulfilled<T> extends ReqState_Fulfilled<T> {
}

export interface RemState_MessagePushEmpty extends ReqState_Empty {
}

export type RemState_MessagePush<T, PR, PM> = (
    | RemState_MessagePushEmpty
    | RemState_MessagePushFulfilled<T>
    | RemState_MessagePushPending<T, PR, PM>
)

export type RemState_Message<T, PR, PM> = (
    | RemState_MessagePush<T, PR, PM>
    | RemState_MessageSetHard<T, PR, PM>
)

export type RemState<T, PR, PM> = sc.Signal<RemState_Message<T, PR, PM>, ReqState<T, PR, PM>>

export type RemState_Atom<T, PR, PM> = Value_Atom<RemState<T, PR, PM>>
