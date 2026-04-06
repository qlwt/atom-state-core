import type { Act_RemPatch_Interpretation_Patch, Act_RemPatch_PatchConfig } from "#src/act/type/patch.js"
import { act__patch_apply } from "#src/act/util/patch/apply.js"
import { promise_new_remdeps } from "#src/promise/new/remdeps.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import * as sc from "@qyu/signal-core"

export type Act_RemPesPatch_ResultApi<PrR> = {
    readonly result: PrR
}

export type Act_RemPesPatch_Interpretation<Def extends RemNode_Def> = {
    readonly target: RemNode<Def>
    readonly patch: Act_RemPatch_Interpretation_Patch<Def["data"]>

    // overrides the global patch_config
    readonly patch_config?: Act_RemPatch_PatchConfig
}

export type Act_RemPesPatch_RequestInit_Params = {
    readonly signal_abort?: AbortSignal
}

export type Act_RemPesPatch_Request<PrR> = {
    readonly init: (params: Act_RemPesPatch_RequestInit_Params) => Promise<PrR>
    readonly interpret: (api: Act_RemPesPatch_ResultApi<PrR>) => readonly Act_RemPesPatch_Interpretation<any>[]

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
    readonly hook_after?: (promise: Promise<PrR>) => void
}

export type Act_RemPesPatch_Config = {
    readonly signal_abort?: AbortSignal
    readonly deps?: readonly RemNode<any>[]
    readonly patch_config?: Act_RemPatch_PatchConfig
}

export type Act_RemPesPatch_Params<PrR> = {
    readonly config?: Act_RemPesPatch_Config
    readonly request: Act_RemPesPatch_Request<PrR>
}

export const act_rempes_patch = function <PrR>(params: Act_RemPesPatch_Params<PrR>): void {
    const r_skip_fallback = params.config?.patch_config?.skip_fallback ?? false
    const r_skip_optimistic = params.config?.patch_config?.skip_optimistic ?? false

    let promise

    if (params.config?.deps && params.config.deps.length) {
        promise = promise_new_remdeps({
            deps: params.config.deps,

            request_new: (l_params) => params.request.init({
                signal_abort: AbortSignal.any([
                    l_params.signal_abort,
                    params.config?.signal_abort ?? null
                ].filter(n => n !== null))
            }),
        })
    } else {
        promise = params.request.init({ signal_abort: params.config?.signal_abort, })
    }

    promise.then(result => {
        if (params.config?.signal_abort?.aborted) { return }

        const resultapi: Act_RemPesPatch_ResultApi<PrR> = {
            result,
        }

        const interpretations = params.request.interpret(resultapi)

        sc.batcher.batch_sync(() => {
            for (const action of interpretations) {
                act__patch_apply({
                    remnode: action.target,
                    interpretation: action.patch,

                    config: {
                        skip_fallback: action.patch_config?.skip_fallback ?? r_skip_fallback,
                        skip_optimistic: action.patch_config?.skip_optimistic ?? r_skip_optimistic,
                    },
                })
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

    params.request.hook_after?.(promise)
}
