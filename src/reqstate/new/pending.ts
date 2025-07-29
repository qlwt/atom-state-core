import { ReqState__Status, type ReqState, type ReqState_Pending } from "#src/reqstate/type/State.js"

export type ReqState__New_Pending_Params<Data, PromiseResult, PromiseMeta> = {
    readonly meta: PromiseMeta
    readonly fallback: Data | null
    readonly optimistic: Data | null

    readonly request_promise: Promise<PromiseResult>
    readonly request_abort: VoidFunction
    readonly request_interpret: (result: PromiseResult) => ReqState<Data>
}

export const reqstate_new_pending = function <Data, PromiseResult, PromiseMeta>(
    params: ReqState__New_Pending_Params<Data, PromiseResult, PromiseMeta>
): ReqState_Pending<Data, PromiseResult, PromiseMeta> {
    return {
        status: ReqState__Status.Pending,

        meta: params.meta,
        optimistic: params.optimistic,
        fallback: params.fallback,

        request_promise: params.request_promise,
        request_abort: params.request_abort,
        request_interpret: params.request_interpret
    }
}
