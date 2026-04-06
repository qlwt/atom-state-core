import type { Act_RemPatch_Interpretation_Patch, Act_RemPatch_PatchConfig } from "#src/act/type/patch.js"
import type { RemNode, RemNode_Cloner, RemNode_Def } from "#src/remnode/type/def.js"
import { ReqState_Status, type ReqState_Pending } from "#src/reqstate/type/state.js"
import type { Modifiable } from "#src/type/object.js"
import { object_deepassign } from "#src/util/object/deepassign.js"

const interpretation_apply = function <Data extends {}>(
    data: Data,
    cloner: RemNode_Cloner<Data>,
    interpretation: Act_RemPatch_Interpretation_Patch<Data>
): Data {
    switch (interpretation.kind) {
        case "flat":
            return { ...data, ...interpretation.data }
        case "deep":
            return cloner(data, cpy => object_deepassign(cpy, interpretation.data))
        case "raw":
            return interpretation.data
    }
}

export type Act__PatchApply_Params<Def extends RemNode_Def> = {
    readonly remnode: RemNode<Def>
    readonly interpretation: Act_RemPatch_Interpretation_Patch<Def["data"]>

    readonly config: Required<Act_RemPatch_PatchConfig>
}

export const act__patch_apply = function <Def extends RemNode_Def>(
    params: Act__PatchApply_Params<Def>
): void {
    const real_o = params.remnode.real.output()

    switch (real_o.status) {
        case ReqState_Status.Empty:
            break
        case ReqState_Status.Pending: {
            let replacement: Modifiable<ReqState_Pending> | null = null

            if (!params.config.skip_fallback && real_o.fallback) {
                replacement ||= { ...real_o }

                replacement.fallback = {
                    ...real_o.fallback,

                    value: interpretation_apply(real_o.fallback.value, params.remnode.meta.cloner, params.interpretation)
                }
            }

            if (!params.config.skip_optimistic && real_o.optimistic) {
                replacement ||= { ...real_o }

                replacement.optimistic = {
                    ...real_o.optimistic,

                    value: interpretation_apply(real_o.optimistic.value, params.remnode.meta.cloner, params.interpretation)
                }
            }

            if (replacement) {
                params.remnode.real.input({
                    status: "set-hard",
                    reqstate: replacement,
                })
            }

            break
        }
        case ReqState_Status.Fulfilled: {
            params.remnode.real.input({
                status: ReqState_Status.Fulfilled,

                data: interpretation_apply(real_o.data, params.remnode.meta.cloner, params.interpretation),
            })

            break
        }
    }
}
