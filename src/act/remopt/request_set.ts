import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { RemState_MessagePush } from "#src/remstate/type/remstate.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"
import { ReqState_Status, type ReqState, type ReqState_Pending_Fallback, type ReqState_Pending_Optimistic } from "#src/reqstate/type/state.js"
import * as sc from "@qyu/signal-core"

export type Act_RemOptRequestSet_ResultApi<
    Def extends RemNode_Def,
    PrR extends Def["request_result"],
    PrM extends Def["request_meta"],
> = {
    readonly meta: PrM
    readonly result: PrR
    readonly fallback: ReqState_Pending_Fallback<Def["data"]> | null
    readonly optimistic: ReqState_Pending_Optimistic<Def["data"]> | null
}

export type ActRemOptRequestSet_InterpretationFail = {
    readonly kind: "fail"
    readonly error: null | { readonly value: any }
}

export type ActRemOptRequestSet_InterpretationSuccess<Def extends RemNode_Def> = {
    readonly kind: "success"
    readonly reqstate: RemState_MessagePush<Def["data"], Def["request_result"], Def["request_meta"]>
}

export type ActRemOptRequestSet_Interpretation<Def extends RemNode_Def> = (
    | ActRemOptRequestSet_InterpretationFail
    | ActRemOptRequestSet_InterpretationSuccess<Def>
)

export type Act_RemOptRequestSet_Config = {
    readonly signal_abort?: AbortSignal
}

export type Act_RemOptRequestSet_Request<
    Def extends RemNode_Def,
    PrR extends Def["request_result"],
    PrM extends Def["request_meta"],
> = {
    readonly meta: PrM
    readonly promise: Promise<PrR>
    readonly interpret: (api: Act_RemOptRequestSet_ResultApi<Def, PrR, PrM>) => ActRemOptRequestSet_Interpretation<Def>

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
}

export type Act_RemOptRequestSet_Optimistic<Data extends {}> = {
    readonly value: Data
}

export type Act_RemOptRequestSet_Fallback<Data extends {}> = {
    readonly value: Data | boolean
    readonly status_view?: boolean
}

const fallback_new = function <Def extends RemNode_Def>(
    reqstate: ReqState<Def["data"]>,
    fallback: Act_RemOptRequestSet_Fallback<Def["data"]> | null | undefined
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
    optimistic: Act_RemOptRequestSet_Optimistic<Def["data"]> | null | undefined
): ReqState_Pending_Optimistic<Def["data"]> | null {
    if (optimistic === null || optimistic === undefined) {
        return null
    }

    return {
        value: optimistic.value,
    }
}

export type Act_RemOptRequestSet_Params<
    Def extends RemNode_Def,
    PrR extends Def["request_result"],
    PrM extends Def["request_meta"],
> = {
    readonly target: RemNode<Def>
    readonly request: Act_RemOptRequestSet_Request<Def, PrR, PrM>
    readonly config?: Act_RemOptRequestSet_Config
    readonly fallback?: Act_RemOptRequestSet_Fallback<Def["data"]> | null
    readonly optimistic?: Act_RemOptRequestSet_Optimistic<Def["data"]> | null
}

export const act_remopt_request_set = function <
    Def extends RemNode_Def,
    PrR extends Def["request_result"] = Def["request_result"],
    PrM extends Def["request_meta"] = Def["request_meta"],
>(params: Act_RemOptRequestSet_Params<Def, PrR, PrM>): void {
    const controller_abort = new AbortController()
    const signal_abort = AbortSignal.any([controller_abort.signal, params.config?.signal_abort ?? null].filter(n => n !== null))

    const remnode = params.target
    const optimistic = optimistic_new(params.optimistic)
    const fallback = fallback_new(remnode.real.output(), params.fallback)

    sc.batcher.batch_sync(() => {
        remnode.real.input({
            status: ReqState_Status.Pending,

            fallback,
            optimistic,
            meta: params.request.meta,
            signal_abort: signal_abort,
            request_promise: params.request.promise,

            request_abort: () => {
                controller_abort.abort()
            },

            request_interpret: result => {
                const resultapi: Act_RemOptRequestSet_ResultApi<Def, PrR, PrM> = {
                    result,
                    fallback,
                    optimistic,
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

        params.request.promise.then((result) => {
            if (signal_abort.aborted) { return }

            params.request.hook_then?.(result)
        }, (reason) => {
            if (signal_abort.aborted) { return }

            params.request.hook_catch?.(reason)
        })
    })
}
