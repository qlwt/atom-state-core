import { Indexer_EventKind, type IdxRouterF, type Indexer, type Indexer_InputEvent, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js";

export type Indexer_NewBoolean_Params<Ref> = {
    readonly router_newf: IdxRouterF<Ref, any, any>
}

export const indexer_new_boolean = function <Ref>(
    params: Indexer_NewBoolean_Params<Ref>
): Indexer<Ref, boolean, boolean> {
    const table = [params.router_newf(), params.router_newf()] as const

    return {
        filter: (fev) => {
            return table[Number(fev[1])]!.filter([fev[0], undefined])
        },

        input: <IMeta>(evs: readonly Indexer_InputEvent<Ref, boolean, IMeta>[]) => {
            const graph = [new Array<Indexer_InputEvent<Ref, any, IMeta>>(), new Array<Indexer_InputEvent<Ref, any, IMeta>>()] as const

            for (const ev of evs) {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        graph[Number(ev[3])]!.push(ev)

                        break
                    }
                    case Indexer_EventKind.Update: {
                        const [, ref, meta, old_data, now_data] = ev

                        if (old_data === now_data) {
                            graph[Number(ev[3])]!.push(ev)
                        } else {
                            graph[Number(ev[3])]!.push([Indexer_EventKind.Delete, ref, meta, null, null])
                            graph[Number(ev[4])]!.push([Indexer_EventKind.Add, ref, meta, null, null])
                        }

                        break
                    }
                    case Indexer_EventKind.Add: {
                        graph[Number(ev[4])]!.push(ev)

                        break
                    }
                }
            }

            if (graph[0].length >= 1) {
                table[0].input(graph[0])
            }
            
            if (graph[1].length >= 1) {
                table[1].input(graph[1])
            }
        },

        input_add: (ref, meta, now_data) => {
            table[Number(now_data)]!.input_add(ref, meta)
        },

        input_delete: (ref, meta, old_data) => {
            table[Number(old_data)]!.input_delete(ref, meta)
        },

        input_update: (ref, meta, old_data, now_data) => {
            if (old_data === now_data) {
                table[Number(old_data)]!.input_update(ref, meta)
            } else {
                table[Number(now_data)]!.input_add(ref, meta)
                table[Number(old_data)]!.input_delete(ref, meta)
            }
        },
    }
}

export const indexer_newf_boolean = function <Ref>(
    params: Indexer_NewBoolean_Params<Ref>
): IndexerF<Ref, boolean, boolean> {
    return () => indexer_new_boolean<Ref>(params)
}

export const indexer_newl_boolean = function <Ref>(): IndexerL<Ref, boolean, boolean> {
    return router_new => indexer_new_boolean<Ref>({
        router_newf: router_new
    })
}
