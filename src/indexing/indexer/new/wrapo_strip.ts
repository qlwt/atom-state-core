import { type IdxOutput, type IdxOutputF } from "#src/indexing/type/indexer.js";

export type Indexer_NewWrapOStrip_Params<Ref, O_Filter, I_Filter> = {
    readonly indexer: IdxOutput<Ref, O_Filter>
    readonly filter_new: (in_filter: I_Filter) => O_Filter
}

export const indexer_new_wrapo_strip = function <Ref, Filter, I_Filter>(
    params: Indexer_NewWrapOStrip_Params<Ref, Filter, I_Filter>
): IdxOutput<Ref, I_Filter> {
    return {
        filter: (fev) => {
            return params.indexer.filter([fev[0], params.filter_new(fev[1])])
        },
    }
}

export const indexer_newf_wrapo_strip = function <Ref, Filter, I_Filter>(
    params: Indexer_NewWrapOStrip_Params<Ref, Filter, I_Filter>
): IdxOutputF<Ref, I_Filter> {
    return () => indexer_new_wrapo_strip(params)
}
