import type { Act_RemPatch_ApiResultOpt, Act_RemPatch_PatchConfig } from "#src/act/type/patch.js"
import { act__patch_apidata } from "#src/act/util/patch/apidata.js"
import { act__patch_apply } from "#src/act/util/patch/apply.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { RemOpt_Patch } from "#src/remopt/type/remopt.js"
import type { PartialDeep } from "#src/type/object.js"
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"
import { object_deepassign } from "#src/util/object/deepassign.js"
import * as sc from "@qyu/signal-core"

export type Act_RemOptPatchSet_Config = {
    readonly signal_abort?: AbortSignal
    readonly callbatcher?: CallBatcher
    readonly patch_config?: Act_RemPatch_PatchConfig
}

export type Act_RemOptPatchSet_OptimisticFlat<RData extends {}> = {
    readonly kind: "flat"
    readonly patch: Partial<RData>
}

export type Act_RemOptPatchSet_OptimisticDeep<RData extends {}> = {
    readonly kind: "deep"
    readonly patch: PartialDeep<RData>
}

export type Act_RemOptPatchSet_OptimisticCustom<RData extends {}, PData> = {
    readonly kind: "custom"

    readonly patch: PData
    readonly applicator: (real_data: RData, patch: PData) => RData
}

export type Act_RemOptPatchSet_OptimisticRaw<RData extends {}, PData> = {
    readonly kind: "raw"
    readonly patch: RemOpt_Patch<RData, PData>
}

export type Act_RemOptPatch_Set_Optimistic<RData extends {}, PData = RData> = (
    | Act_RemOptPatchSet_OptimisticRaw<RData, PData>
    | Act_RemOptPatchSet_OptimisticFlat<RData>
    | Act_RemOptPatchSet_OptimisticCustom<RData, PData>
    | Act_RemOptPatchSet_OptimisticDeep<RData>
)

export type Act_RemOptPatchSet_Request<Def extends RemNode_Def, PData, PrR> = {
    readonly promise: Promise<PrR>
    readonly interpret: (api: Act_RemPatch_ApiResultOpt<Def, PData, PrR>) => Def["data"] | null

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
}

const patch_new = function <Def extends RemNode_Def, PData>(
    optimistic: Act_RemOptPatch_Set_Optimistic<Def["data"], PData> | null | undefined
): RemOpt_Patch<Def["data"], PData> | null {
    if (!optimistic) {
        return null
    }

    switch (optimistic.kind) {
        case "flat": {
            return {
                data: optimistic.patch as PData,
                applicator: Object.assign,
            }
        }
        case "deep": {
            return {
                data: optimistic.patch as PData,

                applicator: (real, pdata) => {
                    return object_deepassign(real, pdata as PartialDeep<Def["data"]>)
                },
            }
        }
        case "custom": {
            return {
                data: optimistic.patch,
                applicator: optimistic.applicator,
            }
        }
        case "raw": {
            return optimistic.patch
        }
    }
}

export type Act_RemOptPatchSet_Params<Def extends RemNode_Def, PData, PrR> = {
    readonly name: string
    readonly target: RemNode<Def>
    readonly request: Act_RemOptPatchSet_Request<Def, PData, PrR>
    readonly config?: Act_RemOptPatchSet_Config
    readonly optimistic?: Act_RemOptPatch_Set_Optimistic<Def["data"], PData>
}

export const act_remopt_patch_set = function <Def extends RemNode_Def, PData, PrR>(
    params: Act_RemOptPatchSet_Params<Def, PData, PrR>
): void {
    const r_skip_fallback = params.config?.patch_config?.skip_fallback ?? false
    const r_skip_optimistic = params.config?.patch_config?.skip_optimistic ?? false

    const remnode = params.target
    const patch = patch_new(params.optimistic)

    sc.batcher.batch_sync(() => {
        const remopt = remnode.optimistic.reg(params.name)

        remopt.input<PData, PrR>({
            kind: "push-active",

            patch,
            callbatcher: params.config?.callbatcher,
            signal_abort: params.config?.signal_abort,

            request_new: (r_params) => ({
                promise: params.request.promise,
                hook_catch: params.request.hook_catch,

                hook_then: result => {
                    if (r_params.signal_abort.aborted) { return }

                    const interpreation_data = params.request.interpret({
                        result,

                        ...act__patch_apidata({
                            patch: patch,
                            remnode: remnode,
                        })
                    })

                    if (interpreation_data !== null) {
                        act__patch_apply({
                            remnode: params.target,

                            interpretation: {
                                kind: "raw",
                                data: interpreation_data,
                            },

                            config: {
                                skip_fallback: r_skip_fallback,
                                skip_optimistic: r_skip_optimistic,
                            },
                        })
                    }

                    params.request.hook_then?.(result)
                },
            }),
        })
    })
}
