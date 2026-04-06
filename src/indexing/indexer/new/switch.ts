import { Indexer_EventKind, type IdxRouter, type IdxRouterF, type Indexer, type Indexer_InputEvent, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js";

export type Indexer_NewSwitch_Params<Ref> = {
    readonly router_newf: IdxRouterF<Ref, any, any>

    readonly offset?: number
}

export const indexer_new_switch = function <Ref, Data extends number = number>(
    params: Indexer_NewSwitch_Params<Ref>
): Indexer<Ref, Data, number> {
    const offset = params.offset ?? 0
    const table: IdxRouter<Ref, any, any>[] = []

    return {
        filter: (fev) => {
            table[fev[1] + offset] ||= params.router_newf()

            return table[fev[1] + offset]!.filter([fev[0], undefined])
        },

        input: <IMeta>(evs: readonly Indexer_InputEvent<Ref, number, IMeta>[]) => {
            const graph: (Indexer_InputEvent<Ref, any, IMeta>[])[] = []

            for (const ev of evs) {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        const change = (graph[ev[3] + offset] ||= [])

                        change.push(ev)

                        break
                    }
                    case Indexer_EventKind.Update: {
                        const [, ref, meta, old_data, now_data] = ev

                        const change_old = (graph[old_data + offset] ||= [])

                        if (old_data === now_data) {
                            change_old.push(ev)
                        } else {
                            const change_now = (graph[now_data + offset] ||= [])

                            change_old.push([Indexer_EventKind.Delete, ref, meta, null, null])
                            change_now.push([Indexer_EventKind.Add, ref, meta, null, null])
                        }

                        break
                    }
                    case Indexer_EventKind.Add: {
                        const change = (graph[ev[4] + offset] ||= [])

                        change.push(ev)

                        break
                    }
                }
            }

            graph.forEach((evs, loc) => {
                const router = (table[loc + offset] ||= params.router_newf())

                router.input(evs)
            })
        },

        input_add: (ref, meta, now_data) => {
            const router = (table[now_data + offset] ||= params.router_newf())

            router.input_add(ref, meta)
        },

        input_delete: (ref, meta, old_data) => {
            const router = (table[old_data + offset] ||= params.router_newf())

            router.input_delete(ref, meta)
        },

        input_update: (ref, meta, old_data, now_data) => {
            const router_old = (table[old_data + offset] ||= params.router_newf())

            if (old_data === now_data) {
                router_old.input_update(ref, meta)
            } else {
                const router_now = (table[now_data + offset] ||= params.router_newf())

                router_now.input_add(ref, meta)
                router_old.input_delete(ref, meta)
            }
        },
    }
}

export const indexer_newf_switch = function <Ref, Data extends number = number>(
    params: Indexer_NewSwitch_Params<Ref>
): IndexerF<Ref, Data, number> {
    return () => indexer_new_switch<Ref, Data>(params)
}

export const indexer_newl_switch = function <Ref, Data extends number = number>(): IndexerL<Ref, Data, number> {
    return router_new => indexer_new_switch<Ref, Data>({
        router_newf: router_new
    })
}
