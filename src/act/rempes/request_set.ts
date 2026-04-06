import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { RemState_MessagePush } from "#src/remstate/type/remstate.js"
import * as sc from "@qyu/signal-core"

export type Act_RemPesRequestSet_ResultApi<PrR> = {
    readonly result: PrR
}

export type Act_RemPesRequestSet_Config = {
    readonly signal_abort?: AbortSignal
}

export type Act_RemPesRequestSet_Request<PrR> = {
    readonly promise: Promise<PrR>

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
    readonly interpret: (api: Act_RemPesRequestSet_ResultApi<PrR>) => readonly Act_RemPesRequestSet_Interpretation<any>[]
}

export type Act_RemPesRequestSet_Interpretation<Def extends RemNode_Def> = {
    readonly target: RemNode<Def>
    readonly reqstate: RemState_MessagePush<Def, Def["request_result"], Def["request_result"]>
}

export type Act_RemPesRequestSet_Params<PrR> = {
    readonly config?: Act_RemPesRequestSet_Config
    readonly request: Act_RemPesRequestSet_Request<PrR>
}

export const act_rempes_request_set = function <PrR>(params: Act_RemPesRequestSet_Params<PrR>): void {
    params.request.promise.then(result => {
        if (params.config?.signal_abort?.aborted) { return }

        const resultapi: Act_RemPesRequestSet_ResultApi<PrR> = {
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
}
