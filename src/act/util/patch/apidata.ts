import type { Act_RemPatch_ApiData } from "#src/act/type/patch.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { RemOpt_Patch } from "#src/remopt/type/remopt.js"
import { reqstate_data } from "#src/reqstate/data.js"

export type Act__PatchApiData_Params<Def extends RemNode_Def, PData> = {
    readonly remnode: RemNode<Def>
    readonly patch: RemOpt_Patch<Def["data"], PData> | null
}

export const act__patch_apidata = function <Def extends RemNode_Def, PData>(
    params: Act__PatchApiData_Params<Def, PData>
): Act_RemPatch_ApiData<Def, PData> {
    return {
        patch: params.patch,

        data_real: () => {
            return reqstate_data(params.remnode.real.output(), () => null)
        },

        data_patched: () => {
            const real_o = reqstate_data(params.remnode.real.output(), () => null)

            if (real_o) {
                return params.remnode.meta.cloner(real_o, cpy => {
                    if (!params.patch) {
                        return cpy
                    }

                    return params.patch.applicator(cpy, params.patch.data)
                })
            }

            return null
        },
    }
}
