import { indexer_new_pair } from "#src/indexing/indexer/new/pair.js"
import { type IdxRouterF, type Indexer, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js"

export type Indexer_NewPairHead_Params<Ref, Data, Filter> = {
    readonly left_newl: IndexerL<Ref, Data, Filter>
    readonly right_newf: IdxRouterF<Ref, any, any>
}

export const indexer_new_pair_head = function <Ref, Data, Filter>(
    params: Indexer_NewPairHead_Params<Ref, Data, Filter>
): Indexer<Ref, Data, Filter> {
    return indexer_new_pair(params)
}

export const indexer_newf_pair_head = function <Ref, Data, Filter>(
    params: Indexer_NewPairHead_Params<Ref, Data, Filter>
): IndexerF<Ref, Data, Filter> {
    return () => indexer_new_pair_head(params)
}

export type Indexer_NewLPairHead_Params<Ref, Data, Filter> = {
    readonly left_newl: IndexerL<Ref, Data, Filter>
}

export const indexer_newl_pair_head = function <Ref, Data, Filter>(
    params: Indexer_NewLPairHead_Params<Ref, Data, Filter>
): IndexerL<Ref, Data, Filter> {
    return router_new => indexer_new_pair_head({
        ...params,

        right_newf: router_new,
    })
}
