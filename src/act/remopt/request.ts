import { promise_new_remdeps } from "#src/promise/new/remdeps.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { RemState_MessagePush } from "#src/remstate/type/remstate.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"
import { ReqState_Status, type ReqState, type ReqState_Pending_Fallback, type ReqState_Pending_Optimistic } from "#src/reqstate/type/state.js"
import { abort_merge } from "#src/util/abort/merge.js"
import * as sc from "@qyu/signal-core"

export type Act_RemOptRequest_ResultApi<
    Def extends RemNode_Def,
    PrR extends Def["request_result"],
    PrM extends Def["request_meta"],
> = {
    readonly meta: PrM
    readonly result: PrR
    readonly fallback: ReqState_Pending_Fallback<Def["data"]> | null
    readonly optimistic: ReqState_Pending_Optimistic<Def["data"]> | null
}

export type ActRemOptRequest_InterpretationFail = {
    readonly kind: "fail"
    readonly error: null | { readonly value: any }
}

export type ActRemOptRequest_InterpretationSuccess<Def extends RemNode_Def> = {
    readonly kind: "success"
    readonly reqstate: RemState_MessagePush<Def["data"], Def["request_result"], Def["request_meta"]>
}

export type ActRemOptRequest_Interpretation<Def extends RemNode_Def> = (
    | ActRemOptRequest_InterpretationFail
    | ActRemOptRequest_InterpretationSuccess<Def>
)

export type Act_RemOptRequest_RequestInit_Params = {
    readonly signal_abort: AbortSignal
}

export type Act_RemOptRequest_Request<
    Def extends RemNode_Def,
    PrR extends Def["request_result"],
    PrM extends Def["request_meta"],
> = {
    readonly meta: PrM

    readonly init: (params: Act_RemOptRequest_RequestInit_Params) => Promise<PrR>
    readonly interpret: (api: Act_RemOptRequest_ResultApi<Def, PrR, PrM>) => ActRemOptRequest_Interpretation<Def>

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
    readonly hook_after?: (promise: Promise<PrR>) => void
}

export type Act_RemOptRequest_Optimistic<Data extends {}> = {
    readonly value: Data
}

export type Act_RemOptRequest_Fallback<Data extends {}> = {
    readonly value: Data | boolean
    readonly status_view?: boolean
}

export type Act_RemOptRequest_Config = {
    readonly signal_abort?: AbortSignal
    readonly deps?: readonly RemNode<any>[]
}

const fallback_new = function <Def extends RemNode_Def>(
    reqstate: ReqState<Def["data"]>,
    fallback: Act_RemOptRequest_Fallback<Def["data"]> | null | undefined
): ReqState_Pending_Fallback<Def["data"]> | null {
    if (fallback === null || fallback === undefined || fallback.value === false) {
        return null
    }

    if (fallback.value === true) {
        switch (reqstate.status) {
            case ReqState_Status.Empty:
                return null
            case ReqState_Status.Pending:
                return reqstate.fallback
            case ReqState_Status.Fulfilled:
                return {
                    value: reqstate.data,
                    status_view: fallback.status_view ?? false
                }
        }
    }

    return {
        value: fallback.value,
        status_view: fallback.status_view ?? false,
    }
}

const optimistic_new = function <Def extends RemNode_Def>(
    optimistic: Act_RemOptRequest_Optimistic<Def["data"]> | null | undefined
): ReqState_Pending_Optimistic<Def["data"]> | null {
    if (optimistic === null || optimistic === undefined) {
        return null
    }

    return {
        value: optimistic.value,
    }
}

export type Act_RemOptRequest_Params<
    Def extends RemNode_Def,
    PrR extends Def["request_result"],
    PrM extends Def["request_meta"],
> = {
    readonly target: RemNode<Def>
    readonly request: Act_RemOptRequest_Request<Def, PrR, PrM>
    readonly config?: Act_RemOptRequest_Config
    readonly fallback?: Act_RemOptRequest_Fallback<Def["data"]> | null
    readonly optimistic?: Act_RemOptRequest_Optimistic<Def["data"]> | null
}

export const act_remopt_request = function <
    Def extends RemNode_Def,
    PrR extends Def["request_result"] = Def["request_result"],
    PrM extends Def["request_meta"] = Def["request_meta"],
>(params: Act_RemOptRequest_Params<Def, PrR, PrM>): void {
    const controller_abort = new AbortController()
    const signal_abort = abort_merge([controller_abort.signal, params.config?.signal_abort])

    if (signal_abort.aborted) {
        return
    }

    const remnode = params.target
    const optimistic = optimistic_new(params.optimistic)
    const fallback = fallback_new(remnode.real.output(), params.fallback)

    let promise

    if (params.config?.deps && params.config.deps.length >= 1) {
        promise = promise_new_remdeps({
            signal_abort,
            deps: params.config.deps,
            request_new: () => params.request.init({ signal_abort, }),
        })
    } else {
        promise = params.request.init({ signal_abort, })
    }

    sc.batcher.batch_sync(() => {
        const abort = () => {
            controller_abort.abort()
        }

        signal_abort.addEventListener("abort", abort)

        remnode.real.input({
            status: ReqState_Status.Pending,

            fallback,
            optimistic,
            signal_abort,
            meta: params.request.meta,
            request_promise: promise,

            request_abort: () => {
                controller_abort.abort()
            },

            request_interpret: result => {
                const resultapi: Act_RemOptRequest_ResultApi<Def, PrR, PrM> = {
                    result,
                    fallback: fallback,
                    optimistic: optimistic,
                    meta: params.request.meta,
                }

                const interpretation = params.request.interpret(resultapi)

                switch (interpretation.kind) {
                    case "fail": {
                        if (fallback) {
                            return reqstate_new_fulfilled(fallback.value)
                        }

                        return reqstate_new_empty({ error: interpretation.error })
                    }
                    case "success": {
                        return interpretation.reqstate
                    }
                }
            },
        })

        promise.then((result) => {
            if (signal_abort.aborted) { return }

            signal_abort.removeEventListener("abort", abort)

            params.request.hook_then?.(result)
        }, (reason) => {
            if (signal_abort.aborted) { return }

            signal_abort.removeEventListener("abort", abort)

            params.request.hook_catch?.(reason)
        })

        params.request.hook_after?.(promise)
    })
}
