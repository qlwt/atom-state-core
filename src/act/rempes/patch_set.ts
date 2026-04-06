import type { Act_RemPatch_Interpretation_Patch, Act_RemPatch_PatchConfig } from "#src/act/type/patch.js"
import { act__patch_apply } from "#src/act/util/patch/apply.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import * as sc from "@qyu/signal-core"

export type Act_RemPesPatchSet_ResultApi<PrR> = {
    readonly result: PrR
}

export type Act_RemPesPatchSet_Interpretation<Def extends RemNode_Def> = {
    readonly target: RemNode<Def>
    readonly patch: Act_RemPatch_Interpretation_Patch<Def["data"]>

    // overrides the global patch_config
    readonly patch_config?: Act_RemPatch_PatchConfig
}

export type Act_RemPesPatchSet_Request<PrR> = {
    readonly promise: Promise<PrR>
    readonly interpret: (api: Act_RemPesPatchSet_ResultApi<PrR>) => readonly Act_RemPesPatchSet_Interpretation<any>[]

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
}

export type Act_RemPesPatchSet_Config = {
    readonly signal_abort?: AbortSignal
    readonly patch_config?: Act_RemPatch_PatchConfig
}

export type Act_RemPesPatchSet_Params<PrR> = {
    readonly config?: Act_RemPesPatchSet_Config
    readonly request: Act_RemPesPatchSet_Request<PrR>
}

export const act_rempes_patch_set = function <PrR>(params: Act_RemPesPatchSet_Params<PrR>): void {
    const r_skip_fallback = params.config?.patch_config?.skip_fallback ?? false
    const r_skip_optimistic = params.config?.patch_config?.skip_optimistic ?? false

    const promise = params.request.promise

    promise.then(result => {
        if (params.config?.signal_abort?.aborted) { return }

        const resultapi: Act_RemPesPatchSet_ResultApi<PrR> = {
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
}
