import type { RemNode_Def } from "#src/remnode/type/def.js"
import type { RemOpt_Patch } from "#src/remopt/type/remopt.js"
import type { PartialDeep } from "#src/type/object.js"

export type Act_RemPatch_Interpretation_PatchFlat<Data extends {}> = {
    readonly kind: "flat"
    readonly data: Partial<Data>
}

export type Act_RemPatch_Interpretation_PatchDeep<Data extends {}> = {
    readonly kind: "deep"
    readonly data: PartialDeep<Data>
}

export type Act_RemPatch_Interpretation_PatchRaw<Data extends {}> = {
    readonly kind: "raw"
    readonly data: Data
}

export type Act_RemPatch_Interpretation_Patch<Data extends {}> = (
    | Act_RemPatch_Interpretation_PatchFlat<Data>
    | Act_RemPatch_Interpretation_PatchDeep<Data>
    | Act_RemPatch_Interpretation_PatchRaw<Data>
)

export type Act_RemPatch_ApiData<Def extends RemNode_Def, PData> = {
    readonly patch: RemOpt_Patch<Def["data"], PData> | null
    readonly data_real: () => Def["data"] | null
    readonly data_patched: () => Def["data"] | null
}

export type Act_RemPatch_ApiResultOpt<Def extends RemNode_Def, PData, PrR> = (
    & Act_RemPatch_ApiData<Def, PData>
    & {
        readonly result: PrR
    }
)

export type Act_RemPatch_PatchConfig = {
    readonly skip_fallback?: boolean
    readonly skip_optimistic?: boolean
}
