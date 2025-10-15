import * as sc from "@qyu/signal-core"

export type Indexer_InferFilter<Index extends IndexerSearch<any, any, any>> = (
    Index extends IndexerSearch<any, any, infer Filter> ? Filter : never
)

export type Indexer_InferData<Index extends IndexerSearch<any, any, any>> = (
    Index extends IndexerSearch<any, infer Data, any> ? Data : never
)

export type Indexer_InferRef<Index extends IndexerSearch<any, any, any>> = (
    Index extends IndexerSearch<infer Ref, any, any> ? Ref : never
)

export interface IndexerSearch<Ref, Data, Filter> {
    readonly test: (filter: Filter, data: Data) => boolean
    readonly find: (filter: Filter) => ReadonlySet<Ref>

    readonly watcher_new: (filter: Filter) => sc.OSignal<ReadonlySet<Ref>>
    readonly watcher_delete: (watcher: sc.OSignal<ReadonlySet<Ref>>) => void
}

export interface Indexer<Ref, Data, Filter> extends IndexerSearch<Ref, Data, Filter> {
    readonly ref_delete: (ref: Ref) => void
    readonly ref_add: (ref: Ref, data: Data) => void
    readonly ref_update: (ref: Ref, data: Data) => void
}
