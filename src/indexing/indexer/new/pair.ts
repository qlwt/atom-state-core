import { Indexer_EventKind, type IdxRouter, type IdxRouterF, type Indexer, type Indexer_InputEvent, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js"


export type Indexer_NewPair_IMeta<Data> = [
    imeta: any,
    old_data: Data | null,
    now_data: Data | null,
]

export type Indexer_NewPair_FMeta<Filter> = [
    fmeta: any,
    filter: Filter,
]

export type Indexer_NewPair_Left_Params<Ref, Data, Filter> = IdxRouterF<Ref, Indexer_NewPair_IMeta<Data>, Indexer_NewPair_FMeta<Filter>>


export type Indexer_NewPair_Params<Ref, Data, Filter> = {
    readonly right_newf: IndexerF<Ref, Data, Filter>
    readonly left_newl: IndexerL<Ref, Data, Filter>
}

export const indexer_new_pair = function <Ref, Data, Filter>(
    params: Indexer_NewPair_Params<Ref, Data, Filter>
): Indexer<Ref, Data, Filter> {
    const left = params.left_newl((): IdxRouter<Ref, Indexer_NewPair_IMeta<Data>, Indexer_NewPair_FMeta<Filter>> => {
        const right = params.right_newf()

        return {
            filter: (fev) => {
                return right.filter(fev[0])
            },

            input_add: (ref, meta) => {
                right.input_add(ref, meta[0], meta[2]!)
            },

            input_delete: (ref, meta) => {
                right.input_delete(ref, meta[0], meta[1]!)
            },

            input_update: (ref, meta) => {
                right.input_update(ref, meta[0], meta[1]!, meta[2]!)
            },

            input: evs => {
                right.input(evs.map(ev => {
                    switch (ev[0]) {
                        case Indexer_EventKind.Delete:
                            return [ev[0], ev[1], ev[2][0], ev[2][1]!, null]
                        case Indexer_EventKind.Update:
                            return [ev[0], ev[1], ev[2][0], ev[2][1]!, ev[2][2]!]
                        case Indexer_EventKind.Add:
                            return [ev[0], ev[1], ev[2][0], null, ev[2][2]!]
                    }
                }))
            },
        }
    })

    return {
        filter: (fev) => {
            return left.filter([
                fev,
                fev[1]
            ])
        },

        input: <IMeta>(evs: Indexer_InputEvent<Ref, Data, IMeta>[]) => {
            left.input(evs.map(ev => {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete:
                        return [ev[0], ev[1], [ev[2], ev[3], null], ev[3], null]
                    case Indexer_EventKind.Update:
                        return [ev[0], ev[1], [ev[2], ev[3], ev[4]], ev[3], ev[4]]
                    case Indexer_EventKind.Add:
                        return [ev[0], ev[1], [ev[2], null, ev[4]], null, ev[4]]
                }
            }))
        },

        input_add: (ref, meta, now_data) => {
            left.input_add(ref, [meta, null, now_data], now_data)
        },

        input_delete: (ref, meta, old_data) => {
            left.input_delete(ref, [meta, old_data, null], old_data)
        },

        input_update: (ref, meta, old_data, now_data) => {
            left.input_update(ref, [meta, old_data, now_data], old_data, now_data)
        },
    }
}

export const indexer_newf_pair = function <Ref, Data, Filter>(
    params: Indexer_NewPair_Params<Ref, Data, Filter>
): IndexerF<Ref, Data, Filter> {
    return () => indexer_new_pair(params)
}
