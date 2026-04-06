import { Indexer_EventKind, type Indexer, type Indexer_Filter_Order, type IndexerF } from "#src/indexing/type/indexer.js";
import { rbtree_delete } from "#src/util/rbtree/delete.js";
import { rbtree_insert } from "#src/util/rbtree/insert.js";
import { rbtree_traverse_direct_inbound, rbtree_traverse_reverse_inbound } from "#src/util/rbtree/traverse.js";
import type { RBTree_Bound, RBTree_Comparator, RBTree_Root } from "#src/util/rbtree/type/node.js";
import * as sc from "@qyu/signal-core";

type Order_New_Params<Ref, Data> = {
    readonly map_data: Map<Ref, { readonly value: Data }>
    readonly root: RBTree_Root<Data, Ref>
    readonly filter: Indexer_NewListSorted_Filter<Data>
}

const order_new = function <Ref, Data>(params: Order_New_Params<Ref, Data>): Indexer_Filter_Order<Ref> {
    const { map_data, root, filter: { bound_start, bound_end } } = params
    const direction = params.filter.reverse ? -1 : 1

    return {
        ref_data_new: (ref) => {
            const saved_dataptr = map_data.get(ref)

            if (saved_dataptr) {
                if (bound_start) {
                    const diff = direction * root.comparator(saved_dataptr.value, bound_start.value)

                    if (
                        (bound_start.inclusive && diff < 0)
                        || (!bound_start.inclusive && diff <= 0)
                    ) {
                        return null
                    }
                }

                if (bound_end) {
                    const diff = direction * root.comparator(saved_dataptr.value, bound_end.value)

                    if (
                        (bound_end.inclusive && diff > 0)
                        || (!bound_end.inclusive && diff >= 0)
                    ) {
                        return null
                    }
                }

                return {
                    value: saved_dataptr.value
                }
            }

            return null
        },

        ref_compare: (ref, data) => {
            const saved_dataptr = map_data.get(ref)

            if (saved_dataptr) {
                if (bound_start) {
                    const diff = direction * root.comparator(saved_dataptr.value, bound_start.value)

                    if (
                        (bound_start.inclusive && diff < 0)
                        || (!bound_start.inclusive && diff <= 0)
                    ) {
                        return null
                    }
                }

                if (bound_end) {
                    const diff = direction * root.comparator(saved_dataptr.value, bound_end.value)

                    if (
                        (bound_end.inclusive && diff > 0)
                        || (!bound_end.inclusive && diff >= 0)
                    ) {
                        return null
                    }
                }

                return direction * root.comparator(saved_dataptr.value, data as Data)
            }

            return null
        },
    }
}

export type Indexer_NewListSorted_Filter<Data> = {
    readonly reverse?: boolean
    readonly bound_end?: null | RBTree_Bound<Data>
    readonly bound_start?: null | RBTree_Bound<Data>
}

export type Indexer_NewListSorted_Params<Data> = {
    readonly comparator: RBTree_Comparator<Data>
}

export const indexer_new_list_sorted = function <Ref, Data>(
    params: Indexer_NewListSorted_Params<Data>
): Indexer<Ref, Data, Indexer_NewListSorted_Filter<Data>> {
    const map_data = new Map<Ref, { readonly value: Data }>()

    const state = sc.signal_new_value<RBTree_Root<Data, Ref>>({
        node: null,
        comparator: params.comparator,
    })

    return {
        input: evs => {
            const todelete: [Ref, Data][] = []
            const toadd: [Ref, Data][] = []

            for (const ev of evs) {
                switch (ev[0]) {
                    case Indexer_EventKind.Add: {
                        toadd.push([ev[1], ev[4]])

                        break
                    }
                    case Indexer_EventKind.Delete: {
                        todelete.push([ev[1], ev[3]])

                        break
                    }
                    case Indexer_EventKind.Update: {
                        toadd.push([ev[1], ev[4]])
                        todelete.push([ev[1], ev[3]])

                        break
                    }
                }
            }

            const state_o = state.output()

            for (let i = 0; i < todelete.length; ++i) {
                const saved = map_data.get(todelete[i]![0])

                if (saved && params.comparator(saved.value, todelete[i]![1]) === 0) {
                    map_data.delete(todelete[i]![0])
                }

                rbtree_delete(state_o, todelete[i]![1])
            }

            for (let i = 0; i < toadd.length; ++i) {
                rbtree_insert(state_o, toadd[i]![1], toadd[i]![0])

                map_data.set(toadd[i]![0], { value: toadd[i]![1] })
            }

            state.input(state_o)
        },

        input_add: (ref, _meta, data) => {
            const state_o = state.output()

            map_data.set(ref, { value: data })
            rbtree_insert(state_o, data, ref)

            state.input(state_o)
        },

        input_delete: (ref, _meta, old_data) => {
            const state_o = state.output()
            const saved = map_data.get(ref)

            if (saved && params.comparator(saved.value, old_data) === 0) {
                map_data.delete(ref)
            }

            rbtree_delete(state_o, old_data)

            state.input(state_o)
        },

        input_update: (ref, _meta, old_data, now_data) => {
            const state_o = state.output()

            map_data.set(ref, { value: now_data })

            rbtree_delete(state_o, old_data)
            rbtree_insert(state_o, now_data, ref)

            state.input(state_o)
        },

        filter: (fev) => {
            const { reverse, bound_start, bound_end } = fev[1]

            return sc.osignal_new_pipe(state, root => ({
                [Symbol.iterator]: () => (reverse
                    ? rbtree_traverse_reverse_inbound(root, {
                        end: bound_end,
                        start: bound_start,
                    })
                    : rbtree_traverse_direct_inbound(root, {
                        end: bound_end,
                        start: bound_start
                    })
                ),

                ref_has: ref => {
                    return map_data.has(ref)
                },

                order: order_new({
                    root,
                    map_data,
                    filter: fev[1],
                }),
            }))
        },
    }
}

export const indexer_newf_list_sorted = function <Ref, Data>(
    params: Indexer_NewListSorted_Params<Data>
): IndexerF<Ref, Data, Indexer_NewListSorted_Filter<Data>> {
    return () => indexer_new_list_sorted(params)
}
