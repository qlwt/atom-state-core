import type { Act_RemPatch_ApiData, Act_RemPatch_ApiResultOpt, Act_RemPatch_PatchConfig } from "#src/act/type/patch.js"
import { act__patch_apidata } from "#src/act/util/patch/apidata.js"
import { act__patch_apply } from "#src/act/util/patch/apply.js"
import { promise_new_remdeps } from "#src/promise/new/remdeps.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { RemOpt_Patch, RemOpt_PatchNew_Params, RemOpt_ScheduleConfig } from "#src/remopt/type/remopt.js"
import type { PartialDeep } from "#src/type/object.js"
import { abort_merge } from "#src/util/abort/merge.js"
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"
import { object_deepassign } from "#src/util/object/deepassign.js"
import { object_deepmerge } from "#src/util/object/deepmerge.js"
import * as sc from "@qyu/signal-core"

export type Act_RemOptPatch_RequestInit_Params<Def extends RemNode_Def, PData> = (
    & {
        readonly signal_abort: AbortSignal
    }
    & Act_RemPatch_ApiData<Def, PData>
)

export type Act_RemOptPatch_OptimisticFlat<RData extends {}> = {
    readonly kind: "flat"
    readonly merge: boolean
    readonly patch: Partial<RData>
}

export type Act_RemOptPatch_OptimisticDeep<RData extends {}> = {
    readonly kind: "deep"
    readonly merge: boolean
    readonly patch: PartialDeep<RData>
}

export type Act_RemOptPatch_OptimisticCustom<RData extends {}, PData> = {
    readonly kind: "custom"

    readonly patch: PData
    readonly merger: (prev: NoInfer<PData>, next: NoInfer<PData>) => NoInfer<PData>
    readonly applicator: (real_data: NoInfer<RData>, patch: NoInfer<PData>) => NoInfer<RData>
}

export type Act_RemOptPatch_OptimisticRaw<RData extends {}, PData> = {
    readonly kind: "raw"
    readonly patch_new: (params: RemOpt_PatchNew_Params<RData, PData>) => RemOpt_Patch<RData, PData>
}

export type Act_RemOptPatch_Optimistic<RData extends {}, PData = RData> = (
    | Act_RemOptPatch_OptimisticRaw<RData, PData>
    | Act_RemOptPatch_OptimisticFlat<RData>
    | Act_RemOptPatch_OptimisticCustom<RData, PData>
    | Act_RemOptPatch_OptimisticDeep<RData>
)

export type Act_RemOptPatch_Config = {
    readonly signal_abort?: AbortSignal

    readonly callbatcher?: CallBatcher
    readonly patch_config?: Act_RemPatch_PatchConfig
    readonly schedule_config?: Partial<RemOpt_ScheduleConfig>

    readonly deps_noself?: boolean
    readonly deps?: readonly RemNode<any>[]
}

export type Act_RemOptPatch_Request<Def extends RemNode_Def, PData, PrR> = {
    readonly init: (params: Act_RemOptPatch_RequestInit_Params<Def, PData>) => Promise<PrR>
    readonly interpret: (api: Act_RemPatch_ApiResultOpt<Def, PData, PrR>) => Def["data"] | null

    readonly hook_then?: (result: PrR) => void
    readonly hook_catch?: (reason: any) => void
    readonly hook_after?: (promise: Promise<PrR>) => void
}

const deps_new = function <Def extends RemNode_Def, PData, PrR>(params: Act_RemOptPatch_Params<Def, PData, PrR>): RemNode<any>[] {
    if (!params.config) {
        return [params.target]
    }

    if (params.config.deps_noself) {
        return [...(params.config.deps ?? [])]
    }

    return [params.target, ...(params.config.deps ?? [])]
}

export type Act_RemOptPatch_Params<Def extends RemNode_Def, PData, PrR> = {
    readonly name: string
    readonly target: RemNode<Def>
    readonly config?: Act_RemOptPatch_Config
    readonly request: Act_RemOptPatch_Request<Def, PData, PrR>
    readonly optimistic?: null | Act_RemOptPatch_Optimistic<Def["data"], PData>
}

export const act_remopt_patch = function <Def extends RemNode_Def, PrR, PData = Partial<Def["data"]>>(params: Act_RemOptPatch_Params<Def, PData, PrR>): void {
    if (params.config?.signal_abort?.aborted) {
        return
    }

    const r_skip_fallback = params.config?.patch_config?.skip_fallback ?? false
    const r_skip_optimistic = params.config?.patch_config?.skip_optimistic ?? false

    const deps = deps_new(params)
    const remnode = params.target

    sc.batcher.batch_sync(() => {
        const remopt = remnode.optimistic.reg(params.name)

        remopt.input<PData, PrR>({
            kind: "push-schedule",

            config: params.config?.schedule_config,
            callbatcher: params.config?.callbatcher,
            signal_abort: params.config?.signal_abort,

            patch_new: (patch_params): RemOpt_Patch<Def["data"], PData> | null => {
                if (!params.optimistic) {
                    return null
                }

                switch (params.optimistic.kind) {
                    case "flat": {
                        if (params.optimistic.merge && patch_params.scheduled) {
                            return {
                                applicator: Object.assign,

                                data: {
                                    ...patch_params.scheduled.data,

                                    ...params.optimistic.patch,
                                } as PData,
                            }
                        }

                        return {
                            data: params.optimistic.patch as PData,
                            applicator: Object.assign,
                        }
                    }
                    case "deep": {
                        if (params.optimistic.merge && patch_params.scheduled) {
                            return {
                                data: object_deepmerge(
                                    patch_params.scheduled.data as PartialDeep<Def["data"]>,
                                    params.optimistic.patch as PartialDeep<PartialDeep<Def["data"]>>,
                                ) as PData,

                                applicator: (real, pdata) => {
                                    return object_deepassign(real, pdata as PartialDeep<Def["data"]>)
                                },
                            }
                        }

                        return {
                            data: params.optimistic.patch as PData,

                            applicator: (real, pdata) => {
                                return object_deepassign(real, pdata as PartialDeep<Def["data"]>)
                            },
                        }
                    }
                    case "custom": {
                        if (patch_params.scheduled) {
                            return {
                                applicator: params.optimistic.applicator,

                                data: params.optimistic.merger(
                                    patch_params.scheduled.data,
                                    params.optimistic.patch
                                ),
                            }
                        }

                        return {
                            data: params.optimistic.patch,
                            applicator: params.optimistic.applicator,
                        }
                    }
                    case "raw": {
                        return params.optimistic.patch_new(patch_params)
                    }
                }
            },

            request_new: (r_params) => {
                let promise

                if (deps.length) {
                    promise = promise_new_remdeps({
                        deps: deps,

                        request_new: (l_params) => params.request.init({
                            signal_abort: abort_merge([r_params.signal_abort, l_params.signal_abort]),

                            ...act__patch_apidata({
                                remnode: remnode,
                                patch: r_params.patch as RemOpt_Patch<Def["data"], PData> | null,
                            })
                        })
                    })
                } else {
                    promise = params.request.init({
                        signal_abort: r_params.signal_abort,

                        ...act__patch_apidata({
                            remnode: remnode,
                            patch: r_params.patch as RemOpt_Patch<Def["data"], PData> | null,
                        })
                    })
                }

                return {
                    promise: promise,
                    hook_after: params.request.hook_after,
                    hook_catch: params.request.hook_catch,

                    hook_then: result => {
                        if (r_params.signal_abort.aborted) { return }

                        const interpreation_data = params.request.interpret({
                            result,

                            ...act__patch_apidata({
                                remnode: remnode,
                                patch: r_params.patch as RemOpt_Patch<Def["data"], PData> | null,
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
                }
            },
        })
    })
}
