import { Indexer_EventKind, type IdxRouterF, type Indexer, type Indexer_InputEvent, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js";

export type Indexer_NewOptional_Data<T> = (
    | {
        readonly value: T
    }
    | null
)

export type Indexer_NewOptional_Filter<T> = (
    | {
        readonly value: T
    }
    | null
)

export type Indexer_NewOptional_Params<Ref, Data, Filter> = {
    readonly router_newf: IdxRouterF<Ref, any, any>
    readonly indexer_newl: IndexerL<Ref, Data, Filter>
}

export const indexer_new_optional = function <Ref, Data, Filter>(
    params: Indexer_NewOptional_Params<Ref, Data, Filter>
): Indexer<Ref, Indexer_NewOptional_Data<Data>, Indexer_NewOptional_Filter<Filter>> {
    const router_all = params.router_newf()
    const indexer = params.indexer_newl(params.router_newf)

    return {
        filter: (fev) => {
            if (fev[1]) {
                return indexer.filter([fev[0], fev[1].value])
            }

            return router_all.filter([fev[0], undefined])
        },

        input: <IMeta>(evs: Indexer_InputEvent<Ref, Indexer_NewOptional_Data<Data>, IMeta>[]) => {
            const evs_o: Indexer_InputEvent<Ref, Data, IMeta>[] = new Array(evs.length)

            {
                let diff = 0

                for (let i = 0, j = 0; i < evs.length; ++i) {
                    const ev = evs[i]!

                    switch (ev[0]) {
                        case Indexer_EventKind.Delete: {
                            if (ev[3]) {
                                evs_o[j++] = [ev[0], ev[1], ev[2], ev[3].value, null]
                            } else {
                                diff += 1
                            }

                            break
                        }
                        case Indexer_EventKind.Update: {
                            if (ev[3]) {
                                if (ev[4]) {
                                    evs_o[j++] = [Indexer_EventKind.Update, ev[1], ev[2], ev[3].value, ev[4].value]
                                } else {
                                    evs_o[j++] = [Indexer_EventKind.Delete, ev[1], ev[2], ev[3].value, null]
                                }
                            } else if (ev[4]) {
                                evs_o[j++] = [Indexer_EventKind.Add, ev[1], ev[2], null, ev[4].value]
                            } else {
                                diff += 1
                            }

                            break
                        }
                        case Indexer_EventKind.Add: {
                            if (ev[4]) {
                                evs_o[j++] = [ev[0], ev[1], ev[2], null, ev[4].value]
                            } else {
                                diff += 1
                            }

                            break
                        }
                    }
                }

                evs_o.length -= diff
            }

            indexer.input(evs_o)
            router_all.input(evs)
        },

        input_add: (ref, meta, now_data) => {
            if (now_data) {
                indexer.input_add(ref, meta, now_data.value)
            }

            router_all.input_add(ref, meta)
        },

        input_delete: (ref, meta, old_data) => {
            if (old_data) {
                indexer.input_delete(ref, meta, old_data.value)
            }
            router_all.input_delete(ref, meta)
        },

        input_update: (ref, meta, old_data, now_data) => {
            if (old_data) {
                if (now_data) {
                    indexer.input_update(ref, meta, old_data.value, now_data.value)
                } else {
                    indexer.input_delete(ref, meta, old_data.value)
                }
            } else if (now_data) {
                indexer.input_add(ref, meta, now_data.value)
            }

            router_all.input_update(ref, meta)
        },
    }
}

export const indexer_newf_optional = function <Ref, Data, Filter>(
    params: Indexer_NewOptional_Params<Ref, Data, Filter>
): IndexerF<Ref, Indexer_NewOptional_Data<Data>, Indexer_NewOptional_Filter<Filter>> {
    return () => indexer_new_optional(params)
}

export type Indexer_NewLOptional_Params<Ref, Data, Filter> = {
    readonly indexer_newl: IndexerL<Ref, Data, Filter>
}

export const indexer_newl_optional = function <Ref, Data, Filter>(
    params: Indexer_NewLOptional_Params<Ref, Data, Filter>
): IndexerL<Ref, Indexer_NewOptional_Data<Data>, Indexer_NewOptional_Filter<Filter>> {
    return router_new => indexer_new_optional({
        ...params,

        router_newf: router_new,
    })
}

