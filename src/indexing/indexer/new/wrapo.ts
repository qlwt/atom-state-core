import { type Indexer, type IndexerF } from "#src/indexing/type/indexer.js";

export type Indexer_NewWrapO_Params<Ref, I_Data, O_Filter, I_Filter> = {
    readonly indexer: Indexer<Ref, I_Data, O_Filter>
    readonly filter_new: (in_filter: I_Filter) => O_Filter
}

export const indexer_new_wrapo = function <Ref, I_Data, O_Filter, I_Filter>(
    params: Indexer_NewWrapO_Params<Ref, I_Data, O_Filter, I_Filter>
): Indexer<Ref, I_Data, I_Filter> {
    return {
        input: params.indexer.input.bind(params.indexer),
        input_add: params.indexer.input_add.bind(params.indexer),
        input_delete: params.indexer.input_delete.bind(params.indexer),
        input_update: params.indexer.input_update.bind(params.indexer),

        filter: (fev) => {
            return params.indexer.filter([fev[0], params.filter_new(fev[1])])
        },
    }
}

export const indexer_newf_wrapo = function <Ref, I_Data, O_Filter, I_Filter>(
    params: Indexer_NewWrapO_Params<Ref, I_Data, O_Filter, I_Filter>
): IndexerF<Ref, I_Data, I_Filter> {
    return () => indexer_new_wrapo(params)
}
