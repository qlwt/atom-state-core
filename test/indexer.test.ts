import { family_atom_hash } from "#src/family/atom/hash.js";
import { debouncer_new_immediate, family_atom_indexer, remnode_atom, remview_new_node, reqstate_new_fulfilled, ReqState_Status, throttler_new_delay, throttler_new_immediate, type RemNode, type RemView } from "#src/index.js";
import { indexer_connect_family } from "#src/indexing/connect/family.js";
import { indexer_connect_family_remnode } from "#src/indexing/connect/family_remnode.js";
import { indexer_new_identity, indexer_newl_identity } from "#src/indexing/indexer/new/identity.js";
import { indexer_new_list_pure, indexer_newf_list_pure } from "#src/indexing/indexer/new/list_pure.js";
import { idxfilter_logic_transform, indexer_new_logic, type Indexer_NewLogic_Filter } from "#src/indexing/indexer/new/logic.js";
import { indexer_newl_optional } from "#src/indexing/indexer/new/optional.js";
import { indexer_new_pair_head } from "#src/indexing/indexer/new/pair_head.js";
import { indexer_new_pipe_head } from "#src/indexing/indexer/new/pipe_head.js";
import { indexer_new_wrap } from "#src/indexing/indexer/new/wrap.js";
import { indexer_new_wrapi_strip } from "#src/indexing/indexer/new/wrapi_strip.js";
import { store_new } from "#src/store/new/index.js";
import { value_atom } from "#src/value/atom/index.js";
import * as sc from "@qyu/signal-core";
import { assert, test } from "vitest";

test("indexer basic", () => {
    type Node = {
        id: string
        kind: number
    }

    const outputs: any[] = []
    const expectation: any[] = []
    const store = store_new()

    const atomfamily = family_atom_hash(() => ({
        key: (id: string) => id,

        get: (id: string) => {
            return value_atom<Node>(() => ({
                id,

                kind: 0
            }))
        }
    }))

    const family = store.reg(atomfamily)

    const indexer = indexer_new_wrap({
        indexer: indexer_new_pair_head({
            left_newl: router_new => indexer_new_identity<Node, number>({ router_newf: router_new }),
            right_newf: () => indexer_new_list_pure<Node>(),
        }),

        data_new: (in_data: Node) => {
            return { value: in_data.kind }
        },

        filter_new: (in_filter: number) => {
            return in_filter
        },
    })

    indexer_connect_family({
        src: family,
        indexer: indexer,
        callbatcher: debouncer_new_immediate(),
    })

    const watcher = indexer.filter([null, 0])

    watcher.addsub(() => {
        outputs.push([...watcher.output()].map(({ id }) => id))
    })

    {
        family.reg("0")

        expectation.push(["0"])
    }

    {
        family.reg("1")

        expectation.push(["0", "1"])
    }

    {
        sc.batcher.batch_sync(() => {
            family.reg("2")
            family.reg("3")
            family.delete("1")
        })

        expectation.push(["0", "2", "3"])
    }

    {
        // should not fire
        family.set_hard("1", {
            id: "1",
            kind: 1
        })

        family.set_hard("2", {
            id: "2",
            kind: 1
        })
    }

    expectation.push(["0", "3"])

    assert.deepStrictEqual(outputs, expectation)
})

test("indexer operations", () => {
    type Node = {
        id: number
        akind: number
        bkind: number
    }

    type Node_Search = Pick<Node, "akind" | "bkind">

    const outputs: any[] = []
    const expectation: any[] = []
    const store = store_new()

    const atomfamily = family_atom_hash(() => ({
        key: (id: number) => id.toString(),

        get: (id: number) => {
            return value_atom<Node>(() => ({
                id,

                akind: 0,
                bkind: 0
            }))
        }
    }))

    const family = store.reg(atomfamily)

    const indexer = indexer_new_wrap({
        data_new: (in_data: Node_Search) => {
            return {
                value: [[{ value: in_data.akind }, { value: in_data.bkind }]] as const
            }
        },

        filter_new: (in_filter: Indexer_NewLogic_Filter<Partial<Node_Search>>) => {
            return idxfilter_logic_transform(in_filter, ifilter => {
                const akind = "akind" in ifilter ? { value: ifilter.akind! } : null
                const bkind = "bkind" in ifilter ? { value: ifilter.bkind! } : null

                return [
                    akind,
                    bkind,
                ] as const
            })
        },

        indexer: indexer_new_pair_head({
            right_newf: indexer_newf_list_pure<Node>(),

            left_newl: router_new => indexer_new_logic({
                loc_new_data: a => `${JSON.stringify(a[0])} ${JSON.stringify(a[1])}`,

                indexer_newf: () => indexer_new_pipe_head({
                    steps: [
                        indexer_newl_optional({
                            indexer_newl: indexer_newl_identity<Node, Node["akind"]>(),
                        }),

                        indexer_newl_optional({
                            indexer_newl: indexer_newl_identity<Node, Node["bkind"]>(),
                        }),
                    ] as const,

                    right_newf: router_new,
                }),
            }),
        }),
    })

    indexer_connect_family({
        src: family,
        indexer: indexer,
        callbatcher: debouncer_new_immediate(),
    })

    const watcher = indexer.filter([null, {
        kind: "intersection",

        children: [
            {
                kind: "pick",

                filter: {
                    bkind: 1,
                },
            },
            {
                kind: "union",

                children: [
                    {
                        kind: "pick",
                        filter: { akind: 0 },
                    },
                    {
                        kind: "pick",
                        filter: { akind: 1 },
                    },
                ],
            }
        ]
    }])

    watcher.addsub(() => {
        outputs.push([...watcher.output()].map(({ id }) => id))
    })

    sc.batcher.batch_sync(() => {
        family.set_hard("0", {
            id: 0,
            akind: 0,
            bkind: 0,
        })

        family.set_hard("1", {
            id: 1,
            akind: 1,
            bkind: 1,
        })

        family.set_hard("2", {
            id: 2,
            akind: 2,
            bkind: 2,
        })

    })

    expectation.push([1])

    family.set_hard("3", {
        id: 3,
        akind: 0,
        bkind: 1,
    })

    expectation.push([1, 3])

    assert.deepStrictEqual(outputs, expectation)
})

test("indexer remnode", async () => {
    type Def = {
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            item_id: number
        }

        request_meta: {
            item_id: number
        }
    }

    type Search = {
        readonly data?: null | {
            readonly item_id: number
        }

        readonly meta?: null | {
            readonly item_id: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const atomfamily = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<Def>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const family = store.reg(atomfamily)

    const indexer = indexer_new_wrap({
        data_new: (in_data: Search) => {
            const data_item_id = in_data.data ? { value: in_data.data.item_id } : null
            const meta_item_id = in_data.meta ? { value: in_data.meta.item_id } : null

            return {
                value: [[data_item_id, meta_item_id] as const]
            }
        },

        filter_new: (in_gate: Indexer_NewLogic_Filter<Search>) => {
            return idxfilter_logic_transform(in_gate, in_filter => {
                const data_item_id = in_filter.data ? { value: in_filter.data.item_id } : null
                const meta_item_id = in_filter.meta ? { value: in_filter.meta.item_id } : null

                return [data_item_id, meta_item_id] as const

            })
        },

        indexer: indexer_new_logic({
            loc_new_data: a => `${a[0]} ${a[1]}`,

            indexer_newf: () => indexer_new_pipe_head({
                right_newf: indexer_newf_list_pure<RemNode<Def>>(),

                steps: [
                    indexer_newl_optional({
                        indexer_newl: indexer_newl_identity<RemNode<Def>, number>(),
                    }),

                    indexer_newl_optional({
                        indexer_newl: indexer_newl_identity<RemNode<Def>, number>(),
                    }),
                ] as const,
            }),
        }),
    })

    const watcher = indexer.filter([null, {
        kind: "union",
        children: [
            {
                kind: "pick",

                filter: {
                    data: {
                        item_id: 1
                    },
                }
            },
            {
                kind: "pick",

                filter: {
                    meta: {
                        item_id: 1
                    },
                }
            },
        ]
    }])

    watcher.addsub(() => {
        outputs.push([...watcher.output()].map(node => {
            return node.statics.id
        }))
    })

    indexer_connect_family_remnode({
        src: family,
        callbatcher: throttler_new_immediate(),

        indexer: indexer_new_wrapi_strip({
            indexer: indexer,

            data_new: (in_data: RemView<Def>) => {
                return {
                    value: {
                        data: in_data.data && {
                            item_id: in_data.data.item_id,
                        },

                        meta: in_data.status === ReqState_Status.Pending ? {
                            item_id: in_data.meta.request.item_id,
                        } : null
                    }
                }
            },
        }),

        view_new: remnode => {
            return remview_new_node(remnode)
        },
    })

    family.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            item_id: 0
        }
    })

    family.reg(1).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 1,
            item_id: 1
        }
    })

    expectation.push([1])

    family.reg(2).real.input({
        status: ReqState_Status.Pending,

        fallback: null,
        optimistic: null,
        request_abort: () => { },
        request_promise: Promise.resolve(),

        meta: {
            item_id: 1,
        },

        request_interpret: () => {
            return reqstate_new_fulfilled({
                id: 2,
                item_id: 1
            })
        },
    })

    expectation.push([1, 2])

    await Promise.resolve()

    expectation.push([1, 2])

    sc.batcher.batch_sync(() => {
        family.reg(1).optimistic.reg("patch").input({
            kind: "push-schedule",
            callbatcher: throttler_new_delay(50),

            request_new: () => {
                return {
                    abort: () => { },
                    promise: Promise.resolve(),
                }
            },

            patch_new: () => ({
                data: {
                    item_id: 2
                },

                applicator: Object.assign,
            }),

            config: {
                instant: true,
                force: false,
            },
        })
    })

    expectation.push([2])

    await Promise.resolve()

    expectation.push([2, 1])

    assert.deepStrictEqual(outputs, expectation)
})

test("atomfamily_indexer", async () => {
    type Def = {
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            item_id: number
        }

        request_meta: {
            item_id: number
        }
    }

    type Search = {
        readonly data?: null | {
            readonly item_id: number
        }

        readonly meta?: null | {
            readonly item_id: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const atomfamily = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<Def>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const family = store.reg(atomfamily)

    const indexfamily = family_atom_indexer(() => ({
        key: param => param.item_id.toString(),

        indexer_new: () => {
            return indexer_new_wrap({
                data_new: (in_data: Search) => {
                    const data_item_id = in_data.data ? { value: in_data.data.item_id } : null
                    const meta_item_id = in_data.meta ? { value: in_data.meta.item_id } : null

                    return {
                        value: [[data_item_id, meta_item_id] as const]
                    }
                },

                filter_new: (in_filter: { item_id: number }) => {
                    return {
                        kind: "union",

                        children: [
                            {
                                kind: "pick",
                                filter: [{ value: in_filter.item_id }, null],
                            },
                            {
                                kind: "pick",
                                filter: [null, { value: in_filter.item_id }],
                            },
                        ]
                    } satisfies Indexer_NewLogic_Filter<[{ value: number } | null, { value: number } | null]>
                },

                indexer: indexer_new_logic({
                    loc_new_data: a => a,

                    indexer_newf: () => indexer_new_pipe_head({
                        right_newf: indexer_newf_list_pure<RemNode<Def>>(),

                        steps: [
                            indexer_newl_optional({
                                indexer_newl: indexer_newl_identity<RemNode<Def>, number>(),
                            }),

                            indexer_newl_optional({
                                indexer_newl: indexer_newl_identity<RemNode<Def>, number>(),
                            }),
                        ] as const,
                    }),
                }),
            })
        },

        indexer_connect: (indexer) => {
            return indexer_connect_family_remnode({
                src: family,
                view_new: remview_new_node,
                callbatcher: throttler_new_immediate(),

                indexer: indexer_new_wrapi_strip({
                    indexer: indexer,

                    data_new: (in_data: RemView<Def>) => {
                        return {
                            value: {
                                data: in_data.data && {
                                    item_id: in_data.data.item_id,
                                },

                                meta: in_data.status === ReqState_Status.Pending ? {
                                    item_id: in_data.meta.request.item_id,
                                } : null
                            }
                        }
                    },
                }),
            })
        },
    }))

    const watcher = store.reg(indexfamily).reg({ item_id: 1 })

    watcher.addsub(() => {
        outputs.push([...watcher.output()].map(node => {
            return node.statics.id
        }))
    })

    family.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            item_id: 0
        }
    })

    family.reg(1).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 1,
            item_id: 1
        }
    })

    expectation.push([1])

    family.reg(2).real.input({
        status: ReqState_Status.Pending,

        request_abort: () => { },
        request_promise: Promise.resolve(),
        fallback: null,
        optimistic: null,

        meta: {
            item_id: 1,
        },

        request_interpret: () => {
            return reqstate_new_fulfilled({
                id: 2,
                item_id: 1
            })
        },
    })

    expectation.push([1, 2])

    await Promise.resolve()

    expectation.push([1, 2])

    sc.batcher.batch_sync(() => {
        family.reg(1).optimistic.reg("patch").input({
            kind: "push-schedule",

            config: {
                instant: true,
                force: false
            },

            request_new: () => {
                return {
                    abort: () => { },
                    promise: Promise.resolve(),
                }
            },

            patch_new: () => ({
                applicator: Object.assign,

                data: {
                    item_id: 2
                },
            }),

            callbatcher: throttler_new_delay(50),
        })
    })

    expectation.push([2])

    await Promise.resolve()

    expectation.push([2, 1])

    assert.deepStrictEqual(outputs, expectation)
})
