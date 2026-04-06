import * as sc from "@qyu/signal-core"

// infers
export type Indexer_InferRef<Src extends IdxOutput<any, any> | IdxInput<any, any>> = (
    (Src extends IdxInput<infer Ref, any>
        ? Ref
        : (Src extends IdxOutput<infer Ref, any>
            ? Ref
            : never
        )
    )
)

export type Indexer_InferData<Src extends IdxInput<any, any>> = (
    (Src extends IdxInput<any, infer Data>
        ? Data
        : never
    )
)

export type Indexer_InferFilter<Src extends IdxOutput<any, any>> = (
    (Src extends IdxOutput<any, infer Filter>
        ? Filter
        : never
    )
)

// input event
export enum Indexer_EventKind {
    Delete,
    Update,
    Add,
}

export type Indexer_InputEventDelete<Ref, Data, Meta> = [
    kind: Indexer_EventKind.Delete,
    ref: Ref,
    meta: Meta,
    old_data: Data,
    now_data: null,
]

export type Indexer_InputEventUpdate<Ref, Data, Meta> = [
    kind: Indexer_EventKind.Update,
    ref: Ref,
    meta: Meta,
    old_data: Data,
    now_data: Data,
]

export type Indexer_InputEventAdd<Ref, Data, Meta> = [
    kind: Indexer_EventKind.Add,
    ref: Ref,
    meta: Meta,
    old_data: null,
    now_data: Data,
]

export type Indexer_InputEvent<Ref, Data, Meta> = (
    | Indexer_InputEventDelete<Ref, Data, Meta>
    | Indexer_InputEventAdd<Ref, Data, Meta>
    | Indexer_InputEventUpdate<Ref, Data, Meta>
)

// filter event
export type Indexer_FilterEvent<Filter, FMeta> = [
    FMeta,
    Filter
]

// idx input
export type IdxInput<Ref, Data> = {
    readonly input: <IMeta>(evs: Indexer_InputEvent<Ref, Data, IMeta>[]) => void
    readonly input_add: <IMeta>(ref: Ref, meta: IMeta, now_data: Data) => void
    readonly input_delete: <IMeta>(ref: Ref, meta: IMeta, old_data: Data) => void
    readonly input_update: <IMeta>(ref: Ref, meta: IMeta, old_data: Data, now_data: Data) => void
}

export type IdxInputF<Ref, Data> = {
    (): IdxInput<Ref, Data>
}

// idx output
export type Indexer_Filter_Order<Ref> = {
    readonly ref_data_new: (ref: Ref) => { value: unknown } | null
    readonly ref_compare: (ref: Ref, data: unknown) => number | null
}

export type Indexer_Filter_Return<Ref> = (
    Iterable<Ref>
    & {
        readonly ref_has: (ref: Ref) => boolean
        readonly order: Indexer_Filter_Order<Ref> | null
    }
)

export type IdxOutput<Ref, Filter> = {
    readonly filter: <FMeta>(ev: Indexer_FilterEvent<Filter, FMeta>) => sc.OSignal<Indexer_Filter_Return<Ref>>
}

export type IdxOutputF<Ref, Filter> = {
    (): IdxOutput<Ref, Filter>
}

// indexer
export interface Indexer<Ref, Data, Filter> extends IdxInput<Ref, Data>, IdxOutput<Ref, Filter> {
}

export type IndexerF<Ref, Data, Filter> = {
    (): Indexer<Ref, Data, Filter>
}

export type IndexerL<Ref, Data, Filter, IMeta = any, FMeta = any> = {
    (router_new: IdxRouterF<Ref, IMeta, FMeta>): Indexer<Ref, Data, Filter>
}

// router-input
export type IdxRInput<Ref, IMeta> = {
    readonly input: (evs: Indexer_InputEvent<Ref, any, IMeta>[]) => void
    readonly input_add: (ref: Ref, meta: IMeta) => void
    readonly input_delete: (ref: Ref, meta: IMeta) => void
    readonly input_update: (ref: Ref, meta: IMeta) => void
}

export type IdxRInputF<Ref, IMeta> = {
    (): IdxRInput<Ref, IMeta>
}

// router-output
export type IdxROutput<Ref, FMeta> = {
    readonly filter: (fev: Indexer_FilterEvent<any, FMeta>) => sc.OSignal<Indexer_Filter_Return<Ref>>
}

export type IdxROutputF<Ref, IMeta> = {
    (): IdxROutput<Ref, IMeta>
}

// router
export interface IdxRouter<Ref, IMeta, FMeta> extends IdxRInput<Ref, IMeta>, IdxROutput<Ref, FMeta> {
}

export type IdxRouterF<Ref, IMeta, FMeta> = {
    (): IdxRouter<Ref, IMeta, FMeta>
}
