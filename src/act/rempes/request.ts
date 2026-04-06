import { promise_new_remdeps } from "#src/promise/new/remdeps.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { RemState_MessagePush } from "#src/remstate/type/remstate.js"
import * as sc from "@qyu/signal-core"

export type Act_RemPesRequest_ResultApi<PrR> = {
    readonly result: PrR
}

export type Act_RemPesRequest_RequestInit_Params = {
    readonly signal_abort?: AbortSignal
}

export type Act_RemPesRequest_Request<PrR> = {
    readonly init: (params: Act_RemPesRequest_RequestInit_Params) => Promise<PrR>

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
    readonly hook_after?: (promise: Promise<PrR>) => void
    readonly interpret: (api: Act_RemPesRequest_ResultApi<PrR>) => readonly Act_RemPesRequest_Interpretation<any>[]
}

export type Act_RemPesRequest_Interpretation<Def extends RemNode_Def> = {
    readonly target: RemNode<Def>
    readonly reqstate: RemState_MessagePush<Def, Def["request_result"], Def["request_result"]>
}

export type Act_RemPesRequest_Config = {
    readonly signal_abort?: AbortSignal
    readonly deps?: readonly RemNode<any>[]
}

export type Act_RemPesRequest_Params<PrR> = {
    readonly config?: Act_RemPesRequest_Config
    readonly request: Act_RemPesRequest_Request<PrR>
}

export const act_rempes_request = function <PrR>(params: Act_RemPesRequest_Params<PrR>): void {
    let promise

    if (params.config?.deps && params.config.deps.length >= 1) {
        promise = promise_new_remdeps({
            deps: params.config.deps,
            signal_abort: params.config.signal_abort,
            request_new: ({ signal_abort }) => params.request.init({ signal_abort }),
        })
    } else {
        promise = params.request.init({ signal_abort: params.config?.signal_abort, })
    }

    promise.then(result => {
        if (params.config?.signal_abort?.aborted) { return }

        const resultapi: Act_RemPesRequest_ResultApi<PrR> = {
            result,
        }

        const interpretations = params.request.interpret(resultapi)

        sc.batcher.batch_sync(() => {
            for (const action of interpretations) {
                action.target.real.input(action.reqstate)
            }

            params.request.hook_then?.(result)
        })
    }, reason => {
        if (params.config?.signal_abort?.aborted) { return }

        if (params.request.hook_catch) {
            params.request.hook_catch(reason)
        } else {
            throw reason
        }
    })

    if (params.request.hook_after) {
        params.request.hook_after(promise)
    }
}
