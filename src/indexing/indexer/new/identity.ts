import { Indexer_EventKind, type IdxRouter, type IdxRouterF, type Indexer, type Indexer_InputEvent, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js";
import { map_lprop_truthy } from "#src/util/map/prop.js";

export type Indexer_New_Params<Ref> = {
    readonly router_newf: IdxRouterF<Ref, any, any>
}

export const indexer_new_identity = function <Ref, Data>(
    params: Indexer_New_Params<Ref>
): Indexer<Ref, Data, Data> {
    const map = new Map<Data, IdxRouter<Ref, any, any>>()

    return {
        filter: (fev) => {
            return map_lprop_truthy(map, fev[1], params.router_newf).filter(
                [fev[0], undefined]
            )
        },

        input: <IMeta>(evs: readonly Indexer_InputEvent<Ref, Data, IMeta>[]) => {
            const graph = new Map<Data, Indexer_InputEvent<Ref, any, IMeta>[]>()

            for (const ev of evs) {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        const change = map_lprop_truthy(graph, ev[3], () => [])

                        change.push(ev)

                        break
                    }
                    case Indexer_EventKind.Update: {
                        const [, ref, meta, old_data, now_data] = ev

                        const change_old = map_lprop_truthy(graph, old_data, () => [])

                        if (old_data === now_data) {
                            change_old.push(ev)
                        } else {
                            const change_now = map_lprop_truthy(graph, now_data, () => [])

                            change_old.push([Indexer_EventKind.Delete, ref, meta, null, null])
                            change_now.push([Indexer_EventKind.Add, ref, meta, null, null])
                        }

                        break
                    }
                    case Indexer_EventKind.Add: {
                        const change = map_lprop_truthy(graph, ev[4], () => [])

                        change.push(ev)

                        break
                    }
                }
            }

            graph.forEach((evs, loc) => {
                map_lprop_truthy(map, loc, params.router_newf).input(evs)
            })
        },

        input_add: (ref, meta, now_data) => {
            map_lprop_truthy(map, now_data, params.router_newf).input_add(ref, meta)
        },

        input_delete: (ref, meta, old_data) => {
            map_lprop_truthy(map, old_data, params.router_newf).input_delete(ref, meta)
        },

        input_update: (ref, meta, old_data, now_data) => {
            if (old_data === now_data) {
                map_lprop_truthy(map, old_data, params.router_newf).input_update(ref, meta)
            } else {
                map_lprop_truthy(map, now_data, params.router_newf).input_add(ref, meta)
                map_lprop_truthy(map, old_data, params.router_newf).input_delete(ref, meta)
            }
        },
    }
}

export const indexer_newf_identity = function <Ref, Data>( params: Indexer_New_Params<Ref>): IndexerF<Ref, Data, Data> {
    return () => indexer_new_identity<Ref, Data>(params)
}

export const indexer_newl_identity = function <Ref, Data>(): IndexerL<Ref, Data, Data> {
    return router_new => indexer_new_identity<Ref, Data>({
        router_newf: router_new
    })
}
