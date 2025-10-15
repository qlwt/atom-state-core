import { atomfamily_new } from "#src/atom/family/new/index.js";
import { atomstore_new } from "#src/atom/store/new/index.js";
import { atomvalue_new } from "#src/atom/value/new/index.js";
import { atomfamily_new_indexer, atomremnode_new, reqstate_new_fulfilled, reqstate_new_pending, type AtomRemNode_Value } from "#src/index.js";
import { indexer_connect_family } from "#src/indexer/connect/family.js";
import { indexer_connect_remnode } from "#src/indexer/connect/remnode.js";
import { indexer_new_object } from "#src/indexer/new/object.js";
import { indexer_new_value } from "#src/indexer/new/value.js";
import { indexersearch_new_and } from "#src/indexer/_search/new/and.js";
import { indexersearch_new_or } from "#src/indexer/_search/new/or.js";
import * as sc from "@qyu/signal-core";
import { assert, test } from "vitest";

test("indexer basis", () => {
    type Node = {
        id: string
        kind: number
    }

    const outputs: any[] = []
    const expectation: any[] = []
    const store = atomstore_new()

    const atomfamily = atomfamily_new({
        key: (id: string) => id,

        get: (id: string) => {
            return atomvalue_new<Node>(() => ({
                id,

                kind: 0
            }))
        }
    })

    const family = store.reg(atomfamily)

    const index = indexer_new_object({
        fields: {
            kind: indexer_new_value<Node, number>({})
        } as const
    })

    store.reg(indexer_connect_family({
        indexer: index,
        source: () => family
    }))

    const watcher = index.watcher_new({
        kind: 0
    })

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

    const outputs: any[] = []
    const expectation: any[] = []
    const store = atomstore_new()

    const atomfamily = atomfamily_new({
        key: (id: number) => id.toString(),

        get: (id: number) => {
            return atomvalue_new<Node>(() => ({
                id,

                akind: 0,
                bkind: 0
            }))
        }
    })

    const family = store.reg(atomfamily)

    const index = indexer_new_object({
        fields: {
            akind: indexer_new_value<Node, number>({}),
            bkind: indexer_new_value<Node, number>({}),
        } as const
    })

    store.reg(indexer_connect_family({
        indexer: index,
        source: () => family
    }))

    const watcher = indexersearch_new_and(
        indexersearch_new_or(
            index
        )
    ).watcher_new([
        [
            {
                akind: 0
            },
            {
                akind: 1
            },
        ],
        [
            {
                bkind: 1
            }
        ]
    ])

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

    const outputs: any[] = []
    const expectation: any[] = []

    const store = atomstore_new()

    const atomfamily = atomfamily_new({
        key: (id: number) => id,

        get: (id: number) => {
            return atomremnode_new<Def>({
                init: () => null,
                statics: () => ({ id }),
            })
        }
    })

    const family = store.reg(atomfamily)

    const index = indexer_new_object({
        fields: {
            data: indexer_new_object({
                fields: {
                    item_id: indexer_new_value<AtomRemNode_Value<Def>, number>({})
                }
            }),

            pending_meta: indexer_new_object({
                fields: {
                    item_id: indexer_new_value<AtomRemNode_Value<Def>, number>({})
                }
            })
        }
    })

    const watcher = indexersearch_new_or(index).watcher_new([
        {
            data: {
                item_id: 1
            }
        },
        {
            pending_meta: {
                item_id: 1
            }
        },
    ])

    watcher.addsub(() => {
        outputs.push([...watcher.output()].map(node => {
            return node.statics.id
        }))
    })

    store.reg(indexer_connect_remnode({
        indexer: index,
        source: () => family
    }))

    store.reg(family.reg(0).real).input(reqstate_new_fulfilled({
        id: 0,
        item_id: 0
    }))

    store.reg(family.reg(1).real).input(reqstate_new_fulfilled({
        id: 1,
        item_id: 1
    }))

    expectation.push([1])

    store.reg(family.reg(2).real).input(reqstate_new_pending({
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
    }))

    expectation.push([1, 2])

    await Promise.resolve()

    expectation.push([1, 2])

    store.reg(family.reg(1).optimistic).reg("patch").input({
        abort: () => { },
        promise: Promise.resolve(),

        data: {
            item_id: 2
        },
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

    const outputs: any[] = []
    const expectation: any[] = []

    const store = atomstore_new()

    const atomfamily = atomfamily_new({
        key: (id: number) => id,

        get: (id: number) => {
            return atomremnode_new<Def>({
                init: () => null,
                statics: () => ({ id }),
            })
        }
    })

    const family = store.reg(atomfamily)

    const indexfamily = atomfamily_new_indexer({
        key: param => param.item_id.toString(),

        indexer: () => {
            const base = indexer_new_object({
                fields: {
                    data: indexer_new_object({
                        fields: {
                            item_id: indexer_new_value<AtomRemNode_Value<Def>, number>({})
                        }
                    }),

                    pending_meta: indexer_new_object({
                        fields: {
                            item_id: indexer_new_value<AtomRemNode_Value<Def>, number>({})
                        }
                    })
                }
            })

            return {
                ...base,

                ...indexersearch_new_or(base)
            }
        },

        connect: (indexer) => {
            return indexer_connect_remnode({
                indexer,
                source: () => family
            })
        },

        param: ({ item_id }: { item_id: number }) => {
            return [
                {
                    data: {
                        item_id
                    }
                },
                {
                    pending_meta: {
                        item_id
                    }
                },
            ]
        },
    })

    const watcher = store.reg(indexfamily).reg({ item_id: 1 })

    watcher.addsub(() => {
        outputs.push([...watcher.output()].map(node => {
            return node.statics.id
        }))
    })

    store.reg(family.reg(0).real).input(reqstate_new_fulfilled({
        id: 0,
        item_id: 0
    }))

    store.reg(family.reg(1).real).input(reqstate_new_fulfilled({
        id: 1,
        item_id: 1
    }))

    expectation.push([1])

    store.reg(family.reg(2).real).input(reqstate_new_pending({
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
    }))

    expectation.push([1, 2])

    await Promise.resolve()

    expectation.push([1, 2])

    store.reg(family.reg(1).optimistic).reg("patch").input({
        abort: () => { },
        promise: Promise.resolve(),

        data: {
            item_id: 2
        },
    })

    expectation.push([2])

    await Promise.resolve()

    expectation.push([2, 1])

    assert.deepStrictEqual(outputs, expectation)
})
