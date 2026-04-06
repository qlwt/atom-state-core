import { ReqState_Status, type ReqState, type ReqState_Pending, type ReqState_Pending_Fallback, type ReqState_Pending_Optimistic } from "#src/reqstate/type/state.js"

export type ReqState_NewPending_Params<Data, PromiseResult, PromiseMeta> = {
    readonly meta: PromiseMeta
    readonly fallback?: ReqState_Pending_Fallback<Data> | null
    readonly optimistic?: ReqState_Pending_Optimistic<Data> | null

    readonly request_promise: Promise<PromiseResult>
    readonly request_interpret: (result: PromiseResult) => ReqState<Data>
    readonly request_abort: () => void
}

export const reqstate_new_pending = function <Data, PromiseResult, PromiseMeta>(
    params: ReqState_NewPending_Params<Data, PromiseResult, PromiseMeta>
): ReqState_Pending<Data, PromiseResult, PromiseMeta> {
    return {
        status: ReqState_Status.Pending,

        meta: params.meta,
        fallback: params.fallback ?? null,
        optimistic: params.optimistic ?? null,

        request_abort: params.request_abort,
        request_promise: params.request_promise,
        request_interpret: params.request_interpret
    }
}
