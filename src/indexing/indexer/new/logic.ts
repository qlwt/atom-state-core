import { Indexer_EventKind, type Indexer, type Indexer_Filter_Order, type Indexer_Filter_Return, type Indexer_InputEvent, type IndexerF } from "#src/indexing/type/indexer.js";
import * as sc from "@qyu/signal-core";

type Iterable_New_Config<Ref, FMeta, Filter> = {
    readonly fmeta: FMeta
    readonly indexer: Indexer<Ref, any, Filter>
}

const gate_use = function <Ref, FMeta, Filter>(
    gate: Indexer_NewLogic_Filter<Filter>, config: Iterable_New_Config<Ref, FMeta, Filter>
): sc.OSignal<Indexer_Filter_Return<Ref>> {
    switch (gate.kind) {
        case "union":
            return gate_use_union(gate, config)
        case "intersection":
            return gate_use_intersection(gate, config)
        case "pick":
            return config.indexer.filter([config.fmeta, gate.filter])
    }
}

const iterator_new_intersection = function* <Ref>(src_list: Indexer_Filter_Return<Ref>[]): IterableIterator<Ref> {
    if (src_list.length === 0) {
        return
    }

    if (src_list.length === 1) {
        yield* src_list[0]!

        return
    }

    const map_counter = new Map<Ref, number>()

    // initialise the counter
    for (const ref of src_list[0]!) {
        map_counter.set(ref, 1)
    }

    // push all other iterables into the counter
    for (let i = 1; i < src_list.length; ++i) {
        for (const ref of src_list[i]!) {
            const n = map_counter.get(ref)

            if (typeof n === "number") {
                map_counter.set(ref, n + 1)
            }
        }
    }

    for (const [ref, counter] of map_counter) {
        if (counter === src_list.length) {
            yield ref
        }
    }
}

const gate_use_intersection = function <Ref, FMeta, Filter>(
    gate: Indexer_NewLogic_FilterIntersection<Filter>, config: Iterable_New_Config<Ref, FMeta, Filter>
): sc.OSignal<Indexer_Filter_Return<Ref>> {
    const iterables = gate.children.map(gate_child => {
        return gate_use(gate_child, config)
    })

    type SrcFiltered = {
        readonly order: Indexer_Filter_Order<Ref>
        readonly src: Indexer_Filter_Return<Ref>
    }

    return sc.osignal_new_pipe(
        sc.osignal_new_merge(iterables),
        src_list => {
            let src_filtered: SrcFiltered[] | null = new Array()

            for (const src_item of src_list) {
                if (src_item.order === null) {
                    src_filtered = null

                    break
                }

                src_filtered.push({
                    src: src_item,
                    order: src_item.order,
                })
            }

            return {
                [Symbol.iterator]: () => iterator_new_intersection(src_list),

                ref_has: ref => {
                    for (const src_item of src_list) {
                        if (!src_item.ref_has(ref)) {
                            return false
                        }
                    }

                    return true
                },

                order: src_filtered ? {
                    ref_data_new: ref => {
                        if (src_filtered.length === 0) {
                            return null
                        }

                        const data = src_filtered[0]!.order.ref_data_new(ref)

                        if (data === null) {
                            return null
                        }

                        for (let i = 1; i < src_filtered.length; ++i) {
                            if (!src_filtered[i]!.src.ref_has(ref)) {
                                return null
                            }
                        }

                        return data
                    },

                    ref_compare: (ref, data) => {
                        if (src_filtered.length === 0) {
                            return null
                        }

                        const diff = src_filtered[0]!.order.ref_compare(ref, data)

                        if (diff === null) {
                            return null
                        }

                        for (let i = 1; i < src_filtered.length; ++i) {
                            if (!src_filtered[i]!.src.ref_has(ref)) {
                                return null
                            }
                        }

                        return diff
                    },
                } : null,
            }
        }
    )
}

const iterator_new_union = function* <Ref>(src_list: Indexer_Filter_Return<Ref>[]): IterableIterator<Ref> {
    if (src_list.length === 0) {
        return
    }

    if (src_list.length === 1) {
        yield* src_list[0]!
    }

    const refs: [Indexer_Filter_Order<Ref>, Ref][] = []
    const repeats = new Set<Ref>()

    for (let src_i = 0; src_i < src_list.length; ++src_i) {
        const src_item = src_list[src_i]!

        if (src_item.order === null) {
            for (const refs_node of refs) {
                yield refs_node[1]
            }

            for (const ref of src_item) {
                if (!repeats.has(ref)) {
                    repeats.add(ref)

                    yield ref
                }
            }

            for (let src_j = src_i + 1; src_j < src_list.length; ++src_j) {
                for (const ref of src_list[src_j]!) {
                    if (!repeats.has(ref)) {
                        repeats.add(ref)

                        yield ref
                    }
                }
            }

            return
        } else {
            for (const ref of src_item) {
                if (!repeats.has(ref)) {
                    repeats.add(ref)

                    refs.push([src_item.order, ref])
                }
            }
        }
    }

    refs.sort((left_node, right_node) => {
        const right_data = right_node[0].ref_data_new(right_node[1])

        if (right_data === null) {
            throw new Error("unexpected path")
        }

        const diff = left_node[0].ref_compare(left_node[1], right_data.value)

        if (diff === null) {
            throw new Error("unexpected path")
        }

        return diff
    })

    for (let i = 0; i < refs.length; ++i) {
        yield refs[i]![1]
    }
}

const gate_use_union = function <Ref, FMeta, Filter>(
    gate: Indexer_NewLogic_FilterUnion<Filter>, config: Iterable_New_Config<Ref, FMeta, Filter>
): sc.OSignal<Indexer_Filter_Return<Ref>> {
    const iterables = gate.children.map(gate_child => {
        return gate_use(gate_child, config)
    })

    return sc.osignal_new_pipe(
        sc.osignal_new_merge(iterables),
        src_list => {
            let orders: Indexer_Filter_Order<Ref>[] | null = new Array()

            for (const src_item of src_list) {
                if (src_item.order === null) {
                    orders = null

                    break
                }

                orders.push(src_item.order)
            }

            return {
                [Symbol.iterator]: () => iterator_new_union(src_list),

                ref_has: ref => {
                    for (const src_item of src_list) {
                        if (src_item.ref_has(ref)) {
                            return true
                        }
                    }

                    return false
                },

                order: orders ? {
                    ref_data_new: ref => {
                        for (const order of orders) {
                            const order_data = order.ref_data_new(ref)

                            if (order_data) {
                                return order_data
                            }
                        }

                        return null
                    },

                    ref_compare: (ref, data) => {
                        for (const order of orders) {
                            const diff = order.ref_compare(ref, data)

                            if (diff !== null) {
                                return diff
                            }
                        }

                        return null
                    }
                } : null,
            }
        }
    )
}

export const idxfilter_logic_transform = function <FI, FO>(
    gate: Indexer_NewLogic_Filter<FI>, transformer: (input: FI) => FO
): Indexer_NewLogic_Filter<FO> {
    switch (gate.kind) {
        case "pick":
            return {
                kind: "pick",
                filter: transformer(gate.filter),
            }
        case "union":
            return {
                kind: "union",
                children: gate.children.map(child => idxfilter_logic_transform(child, transformer))
            }
        case "intersection":
            return {
                kind: "intersection",
                children: gate.children.map(child => idxfilter_logic_transform(child, transformer))
            }
    }
}

export type Indexer_NewLogic_FilterUnion<Filter> = {
    readonly kind: "union"
    readonly children: Indexer_NewLogic_Filter<Filter>[]
}

export type Indexer_NewLogic_FilterIntersection<Filter> = {
    readonly kind: "intersection"
    readonly children: Indexer_NewLogic_Filter<Filter>[]
}

export type Indexer_NewLogic_FilterPick<Filter> = {
    readonly kind: "pick"
    readonly filter: Filter
}

export type Indexer_NewLogic_Filter<Filter> = (
    | Indexer_NewLogic_FilterPick<Filter>
    | Indexer_NewLogic_FilterUnion<Filter>
    | Indexer_NewLogic_FilterIntersection<Filter>
)

export type Indexer_NewLogic_Params<Ref, Data, Filter> = {
    readonly loc_new_data: (a: Data) => unknown
    readonly indexer_newf: IndexerF<Ref, Data, Filter>
}

export const indexer_new_logic = function <Ref, Data, Filter>(
    params: Indexer_NewLogic_Params<Ref, Data, Filter>
): Indexer<Ref, readonly Data[], Indexer_NewLogic_Filter<Filter>> {
    const indexer = params.indexer_newf()

    return {
        input: <IMeta>(evs: Indexer_InputEvent<Ref, readonly Data[], IMeta>[]) => {
            const oevs: Indexer_InputEvent<Ref, Data, IMeta>[] = []

            for (const ev of evs) {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        const [, ref, meta, old_data, _now_data] = ev

                        for (const old_data_item of old_data) {
                            oevs.push([Indexer_EventKind.Delete, ref, meta, old_data_item, null])
                        }

                        break
                    }
                    case Indexer_EventKind.Update: {
                        const [, ref, meta, old_data, now_data] = ev

                        const old_locs = new Map<unknown, [Data]>()

                        for (const old_data_item of old_data) {
                            const loc = params.loc_new_data(old_data_item)

                            old_locs.set(loc, [old_data_item])
                        }

                        for (const now_data_item of now_data) {
                            const loc = params.loc_new_data(now_data_item)
                            const old_locptr = old_locs.get(loc)

                            if (old_locptr) {
                                // old is present - should register an update
                                old_locs.delete(loc)

                                oevs.push([Indexer_EventKind.Update, ref, meta, old_locptr[0], now_data_item])
                            } else {
                                // old is not present - should register an add
                                oevs.push([Indexer_EventKind.Add, ref, meta, null, now_data_item])
                            }
                        }

                        old_locs.forEach(old_data_item => {
                            oevs.push([Indexer_EventKind.Delete, ref, meta, old_data_item[0], null])
                        })

                        break
                    }
                    case Indexer_EventKind.Add: {
                        const [, ref, meta, _old_data, now_data] = ev

                        // update saved locs
                        for (const data_item of now_data) {
                            oevs.push([Indexer_EventKind.Add, ref, meta, null, data_item])
                        }

                        break
                    }
                }
            }

            indexer.input(oevs)
        },

        input_add: (ref, meta, now_data) => {
            // update saved locs
            for (const data_item of now_data) {
                indexer.input_add(ref, meta, data_item)
            }
        },

        input_delete: (ref, meta, old_data) => {
            for (const old_data_item of old_data) {
                indexer.input_delete(ref, meta, old_data_item)
            }
        },

        input_update: (ref, meta, old_data, now_data) => {
            const old_locs = new Map<unknown, [Data]>()

            for (const old_data_item of old_data) {
                const loc = params.loc_new_data(old_data_item)

                old_locs.set(loc, [old_data_item])
            }

            for (const now_data_item of now_data) {
                const loc = params.loc_new_data(now_data_item)
                const old_locptr = old_locs.get(loc)

                if (old_locptr) {
                    // old is present - should register an update
                    old_locs.delete(loc)

                    indexer.input_update(ref, meta, old_locptr[0], now_data_item)
                } else {
                    // old is not present - should register an add
                    indexer.input_add(ref, meta, now_data_item)
                }
            }

            old_locs.forEach(old_data_item => {
                indexer.input_delete(ref, meta, old_data_item[0])
            })
        },

        filter: (fev) => {
            return gate_use(fev[1], {
                fmeta: fev[0],
                indexer: indexer,
            })
        },
    }
}

export const indexer_newf_logic = function <Ref, Data, Filter>(
    params: Indexer_NewLogic_Params<Ref, Data, Filter>
): IndexerF<Ref, readonly Data[], Indexer_NewLogic_Filter<Filter>> {
    return () => indexer_new_logic(params)
}
