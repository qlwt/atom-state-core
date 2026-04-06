import { indexer_new_wrapi_strip } from "#src/indexing/indexer/new/wrapi_strip.js";
import { indexer_new_wrapo_strip } from "#src/indexing/indexer/new/wrapo_strip.js";
import { type Indexer, type IndexerF } from "#src/indexing/type/indexer.js";

export type Indexer_NewWrap_Params<Ref, O_Data, O_Filter, I_Data, I_Filter> = {
    readonly indexer: Indexer<Ref, O_Data, O_Filter>
    readonly filter_new: (in_filter: I_Filter) => O_Filter
    readonly data_new: (in_data: I_Data) => { readonly value: O_Data } | null
}

export const indexer_new_wrap = function <Ref, Data, Filter, I_Data, I_Filter>(
    params: Indexer_NewWrap_Params<Ref, Data, Filter, I_Data, I_Filter>
): Indexer<Ref, I_Data, I_Filter> {
    const part_in = indexer_new_wrapi_strip(params)
    const part_out = indexer_new_wrapo_strip(params)

    return {
        ...part_in,
        ...part_out
    }
}

export const indexer_newf_wrap = function <Ref, Data, Filter, I_Data, I_Filter>(
    params: Indexer_NewWrap_Params<Ref, Data, Filter, I_Data, I_Filter>
): IndexerF<Ref, I_Data, I_Filter> {
    return () => indexer_new_wrap(params)
}
