import { indexer_new_list_sorted, indexer_new_pipe, indexer_newf_list_sorted, type Indexer_NewListSorted_Filter } from "#src/index.js"
import { indexer_fev_new } from "#src/indexing/fev/new.js"
import { indexer_iev_new_add } from "#src/indexing/iev/new/add.js"
import { indexer_iev_new_delete } from "#src/indexing/iev/new/delete.js"
import { indexer_iev_new_update } from "#src/indexing/iev/new/update.js"
import { indexer_new_identity, indexer_newf_identity } from "#src/indexing/indexer/new/identity.js"
import { indexer_new_list_pure } from "#src/indexing/indexer/new/list_pure.js"
import { indexer_new_logic, type Indexer_NewLogic_Filter } from "#src/indexing/indexer/new/logic.js"
import { indexer_new_optional } from "#src/indexing/indexer/new/optional.js"
import { indexer_new_pair } from "#src/indexing/indexer/new/pair.js"
import { indexer_new_pair_head } from "#src/indexing/indexer/new/pair_head.js"
import { indexer_new_pipe_head } from "#src/indexing/indexer/new/pipe_head.js"
import { indexer_new_wrap } from "#src/indexing/indexer/new/wrap.js"
import { assert, test } from "vitest"

test("indexing base", () => {
    const node_a = { name: "node_a" }
    const node_b = { name: "node_b" }
    const node_c = { name: "node_c" }

    const indexer = indexer_new_identity<typeof node_a, string>({
        router_newf: () => indexer_new_list_pure()
    })

    indexer.input([indexer_iev_new_add(node_a, "a")])
    indexer.input([indexer_iev_new_add(node_b, "b")])
    indexer.input([indexer_iev_new_add(node_c, "c")])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new("a")).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new("b")).output()], [node_b])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new("c")).output()], [node_c])

    indexer.input([indexer_iev_new_delete(node_b, "b")])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new("b")).output()], [])

    indexer.input([indexer_iev_new_add(node_b, "a")])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new("a")).output()], [node_a, node_b])

    indexer.input([indexer_iev_new_update(node_b, "a", "b")])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new("a")).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new("b")).output()], [node_b])
})

test("indexing pair", () => {
    const node_a = { name: "node_a" }
    const node_b = { name: "node_b" }
    const node_c = { name: "node_c" }

    const collector = indexer_new_pair({
        left_newl: router_new => indexer_new_wrap({
            indexer: indexer_new_identity({
                router_newf: router_new
            }),

            filter_new: (in_filter: readonly [string, number]) => in_filter[0],
            data_new: (in_data: readonly [string, number]) => ({ value: in_data[0] }),
        }),

        right_newf: () => indexer_new_wrap({
            indexer: indexer_new_identity({
                router_newf: () => indexer_new_list_pure<typeof node_a>()
            }),

            filter_new: (in_filter: readonly [string, number]) => in_filter[1],
            data_new: (in_data: readonly [string, number]) => ({ value: in_data[1] }),
        })
    })

    collector.input([indexer_iev_new_add(node_a, ["a", 0])])
    collector.input([indexer_iev_new_add(node_b, ["b", 0])])
    collector.input([indexer_iev_new_add(node_c, ["c", 0])])

    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["a", 1])).output()], [])
    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["a", 0])).output()], [node_a])
    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["b", 0])).output()], [node_b])
    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["c", 0])).output()], [node_c])

    collector.input([indexer_iev_new_update(node_a, ["a", 0], ["a", 1])])

    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["a", 0])).output()], [])
    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["a", 1])).output()], [node_a])
    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["b", 0])).output()], [node_b])
    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["c", 0])).output()], [node_c])

    collector.input([indexer_iev_new_delete(node_b, ["b", 0])])

    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["b", 0])).output()], [])

    collector.input([indexer_iev_new_add(node_b, ["a", 0])])

    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["a", 0])).output()], [node_b])

    collector.input([indexer_iev_new_delete(node_a, ["a", 1])])

    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["a", 0])).output()], [node_b])
    assert.deepStrictEqual([...collector.filter(indexer_fev_new(["a", 1])).output()], [])
})

test("indexing pipe", () => {
    const node_a = { name: "node_a" }
    const node_b = { name: "node_b" }
    const node_c = { name: "node_c" }

    const indexer = indexer_new_pipe_head({
        steps: [
            router_new => indexer_new_identity<typeof node_a, string>({ router_newf: router_new }),
            router_new => indexer_new_identity<typeof node_a, string>({ router_newf: router_new }),
        ] as const,

        right_newf: () => indexer_new_list_pure<typeof node_a>(),
    })

    indexer.input([indexer_iev_new_add(node_a, ["a", "a"])])
    indexer.input([indexer_iev_new_add(node_b, ["b", "b"])])
    indexer.input([indexer_iev_new_add(node_c, ["c", "c"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "a"])).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "b"])).output()], [])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["b", "a"])).output()], [])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["b", "b"])).output()], [node_b])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["c", "c"])).output()], [node_c])

    indexer.input([indexer_iev_new_delete(node_b, ["b", "b"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["b", "b"])).output()], [])

    indexer.input([indexer_iev_new_add(node_b, ["a", "a"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "a"])).output()], [node_a, node_b])

    indexer.input([indexer_iev_new_update(node_b, ["a", "a"], ["b", "b"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "a"])).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["b", "b"])).output()], [node_b])

    indexer.input([indexer_iev_new_delete(node_b, ["b", "b"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "a"])).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["b", "b"])).output()], [])

    indexer.input([indexer_iev_new_add(node_b, ["a", "a"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "a"])).output()], [node_a, node_b])

    indexer.input([indexer_iev_new_update(node_b, ["a", "a"], ["a", "b"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "a"])).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "b"])).output()], [node_b])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["b", "b"])).output()], [])

    indexer.input([indexer_iev_new_delete(node_b, ["a", "b"])])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "a"])).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["a", "b"])).output()], [])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(["b", "b"])).output()], [])
})

test("indexing indexer_optional", () => {
    const node_a = { name: "node_a" }
    const node_b = { name: "node_b" }
    const node_c = { name: "node_c" }

    const indexer = indexer_new_pair_head({
        left_newl: router_new => indexer_new_optional<typeof node_a, string, string>({
            router_newf: router_new,

            indexer_newl: router_new => indexer_new_identity<typeof node_a, string>({
                router_newf: router_new
            })
        }),

        right_newf: () => indexer_new_list_pure<typeof node_a>(),
    })

    indexer.input([indexer_iev_new_add(node_a, { value: "a" })])
    indexer.input([indexer_iev_new_add(node_b, { value: "b" })])
    indexer.input([indexer_iev_new_add(node_c, { value: "c" })])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(null)).output()], [node_a, node_b, node_c])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new({ value: "a" })).output()], [node_a])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new({ value: "b" })).output()], [node_b])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new({ value: "c" })).output()], [node_c])

    indexer.input([indexer_iev_new_delete(node_b, { value: "b" })])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(null)).output()], [node_a, node_c])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new({ value: "b" })).output()], [])

    indexer.input([indexer_iev_new_add(node_b, { value: "a" })])

    assert.deepStrictEqual([...indexer.filter(indexer_fev_new(null)).output()], [node_a, node_c, node_b])
    assert.deepStrictEqual([...indexer.filter(indexer_fev_new({ value: "a" })).output()], [node_a, node_b])
})

test("indexing indexer_logic", () => {
    const node_a = { name: "node_a" }
    const node_b = { name: "node_b" }
    const node_c = { name: "node_c" }

    const indexer = indexer_new_pair_head({
        left_newl: router_new => indexer_new_logic<typeof node_a, string, string>({
            indexer_newf: () => indexer_new_identity<typeof node_a, string>({
                router_newf: router_new
            }),

            loc_new_data: data => data,
        }),

        right_newf: () => indexer_new_list_pure<typeof node_a>(),
    })

    indexer.input([indexer_iev_new_add(node_a, ["a"])])
    indexer.input([indexer_iev_new_add(node_b, ["b", "a"])])
    indexer.input([indexer_iev_new_add(node_c, ["c"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a, node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        [node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "c" }
        )).output()],
        [node_c]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "c" },
                    { kind: "pick", filter: "b" },
                ]
            }
        )).output()],
        [node_c, node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            {
                kind: "intersection",
                children: [
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            }
        )).output()],
        [node_b]
    )

    indexer.input([indexer_iev_new_delete(node_b, ["b", "a"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        []
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a]
    )

    indexer.input([indexer_iev_new_add(node_b, ["a"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a, node_b]
    )

    indexer.input([indexer_iev_new_update(node_b, ["a"], ["a", "b"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a, node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        [node_b]
    )

    indexer.input([indexer_iev_new_update(node_b, ["a", "b"], ["b"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        [node_b]
    )

    indexer.input([indexer_iev_new_delete(node_b, ["b"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        []
    )

    indexer.input([indexer_iev_new_add(node_b, ["b"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        [node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "c" }
        )).output()],
        [node_c]
    )

    indexer.input([indexer_iev_new_update(node_b, ["b"], ["a", "b", "c"])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a, node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        [node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "c" }
        )).output()],
        [node_c, node_b]
    )

    indexer.input([indexer_iev_new_delete(node_b, ["a", "b", "c"])])


    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "a" }
        )).output()],
        [node_a]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "b" }
        )).output()],
        []
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new(
            { kind: "pick", filter: "c" }
        )).output()],
        [node_c]
    )
})

test("indexing indexer_logic order", () => {
    const node_0 = { name: "node_0", value: -1 }
    const node_a = { name: "node_a", value: 0 }
    const node_b = { name: "node_b", value: 1 }
    const node_c = { name: "node_c", value: 2 }
    const node_d = { name: "node_d", value: 3 }
    const node_f = { name: "node_f", value: 4 }

    const indexer = indexer_new_pipe({
        steps: [
            router_new => indexer_new_logic<typeof node_a, string, string>({
                indexer_newf: () => indexer_new_identity<typeof node_a, string>({
                    router_newf: router_new
                }),

                loc_new_data: data => data,
            })
        ] as const,

        right_newf: indexer_newf_list_sorted<typeof node_a, number>({
            comparator: (a, b) => a - b,
        }),
    })

    indexer.input([indexer_iev_new_add(node_a, [["a"], node_a.value])])
    indexer.input([indexer_iev_new_add(node_b, [["b", "a"], node_b.value])])
    indexer.input([indexer_iev_new_add(node_c, [["c"], node_c.value])])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            { kind: "pick", filter: "a" },
            {}
        ] as const)).output()],
        [node_a, node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            { kind: "pick", filter: "a" },
            { reverse: true } satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_b, node_a]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "b" },
                    { kind: "pick", filter: "c" },
                ]
            },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_b, node_c]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "c" },
                    { kind: "pick", filter: "b" },
                ]
            },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_b, node_c]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "b" },
                    { kind: "pick", filter: "c" },
                ]
            },
            { reverse: true } satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_c, node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "c" },
                    { kind: "pick", filter: "b" },
                ]
            },
            { reverse: true } satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_c, node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "c" },
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_a, node_b, node_c]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "c" },
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            },
            { reverse: true } satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_c, node_b, node_a]
    )

    indexer.input_delete(node_b, null, [["a"], node_b.value])
    indexer.input_add(node_c, null, [["a"], node_c.value])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            { kind: "pick", filter: "a" },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_a, node_c]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            { kind: "pick", filter: "b" },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_b]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_a, node_b, node_c]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            },
            { reverse: true } satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_c, node_b, node_a]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "intersection",
                children: [
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        []
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "intersection",
                children: [
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "c" },
                ]
            },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_c]
    )

    indexer.input_add(node_d, null, [["b", "c"], node_d.value])
    indexer.input_add(node_f, null, [["a"], node_f.value])
    indexer.input_add(node_0, null, [["c"], node_0.value])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            },
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_a, node_b, node_c, node_d, node_f]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "union",
                children: [
                    { kind: "pick", filter: "a" },
                    { kind: "pick", filter: "b" },
                ]
            },
            { reverse: true } satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_f, node_d, node_c, node_b, node_a]
    )

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "intersection",
                children: [
                    {
                        kind: "union",
                        children: [
                            { kind: "pick", filter: "a" },
                            { kind: "pick", filter: "b" },
                        ]
                    },
                    {
                        kind: "pick",
                        filter: "c",
                    }
                ] as const,
            } satisfies Indexer_NewLogic_Filter<string>,
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_c, node_d]
    )

    indexer.input_add(node_0, null, [["b"], node_0.value])

    assert.deepStrictEqual(
        [...indexer.filter(indexer_fev_new([
            {
                kind: "intersection",
                children: [
                    {
                        kind: "union",
                        children: [
                            { kind: "pick", filter: "a" },
                            { kind: "pick", filter: "b" },
                        ]
                    },
                    {
                        kind: "pick",
                        filter: "c",
                    }
                ] as const,
            } satisfies Indexer_NewLogic_Filter<string>,
            {} satisfies Indexer_NewListSorted_Filter<string>
        ] as const)).output()],
        [node_0, node_c, node_d]
    )
})

test("indexing list order", () => {
    const node_a = { name: "node_a", value: 0 }
    const node_b = { name: "node_b", value: 1 }
    const node_c = { name: "node_c", value: 2 }
    const node_d = { name: "node_d", value: 3 }
    const node_e = { name: "node_e", value: 4 }
    const node_f = { name: "node_f", value: 5 }

    const indexer = indexer_new_pipe({
        steps: [
            router_newf => indexer_new_logic({
                loc_new_data: a => a,

                indexer_newf: indexer_newf_identity<typeof node_a, string>({
                    router_newf
                })
            })
        ] as const,

        right_newf: indexer_newf_list_sorted<typeof node_a, number>({
            comparator: (a, b) => a - b,
        }),
    })

    indexer.input_add(node_a, null, [["l", "g1"], node_a.value])
    indexer.input_add(node_b, null, [["l", "g2"], node_b.value])
    indexer.input_add(node_c, null, [["l", "g2"], node_c.value])
    indexer.input_add(node_d, null, [["r", "g1"], node_d.value])
    indexer.input_add(node_e, null, [["r", "g1"], node_e.value])
    indexer.input_add(node_f, null, [["r", "g2"], node_f.value])

    // SECTION_UNION
    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "union",
            children: [
                { kind: "pick", filter: "g1" },
                { kind: "pick", filter: "g2" },
            ]
        }, {}]]).output()],
        [node_a, node_b, node_c, node_d, node_e, node_f]
    )

    {
        const order = indexer.filter([null, [{
            kind: "union",
            children: [
                { kind: "pick", filter: "g1" },
                { kind: "pick", filter: "g2" },
            ]
        }, {}]]).output().order!

        // assert.equal(order.head_data_new()!.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()!.value, node_f.value)
        // assert.equal(order.tail_compare(0), node_f.value)
        assert.equal(order.ref_data_new(node_a)!.value, node_a.value)
        assert.equal(order.ref_compare(node_a, 0), node_a.value)
        assert.equal(order.ref_data_new(node_b)!.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), node_b.value)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "union",
            children: [
                { kind: "union", children: [] },
                { kind: "pick", filter: "g1" },
                { kind: "pick", filter: "g2" },
            ]
        }, {}]]).output()],
        [node_a, node_b, node_c, node_d, node_e, node_f]
    )

    {
        const order = indexer.filter([null, [{
            kind: "union",
            children: [
                { kind: "union", children: [] },
                { kind: "pick", filter: "g1" },
                { kind: "pick", filter: "g2" },
            ]
        }, {}]]).output().order!

        // assert.equal(order.head_data_new()!.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()!.value, node_f.value)
        // assert.equal(order.tail_compare(0), node_f.value)
        assert.equal(order.ref_data_new(node_a)!.value, node_a.value)
        assert.equal(order.ref_compare(node_a, 0), node_a.value)
        assert.equal(order.ref_data_new(node_b)!.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), node_b.value)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "union",
            children: [
                { kind: "pick", filter: "l" },
                { kind: "pick", filter: "g1" },
            ]
        }, {}]]).output()],
        [node_a, node_b, node_c, node_d, node_e]
    )

    {
        const order = indexer.filter([null, [{
            kind: "union",
            children: [
                { kind: "pick", filter: "l" },
                { kind: "pick", filter: "g1" },
            ]
        }, {}]]).output().order!

        // assert.equal(order.head_data_new()!.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()!.value, node_e.value)
        // assert.equal(order.tail_compare(0), node_e.value)
        assert.equal(order.ref_data_new(node_a)!.value, node_a.value)
        assert.equal(order.ref_compare(node_a, 0), node_a.value)
        assert.equal(order.ref_data_new(node_b)!.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), node_b.value)
        assert.equal(order.ref_data_new(node_f), null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "g2" },
                { kind: "pick", filter: "l" },
            ]
        }, {}]]).output()],
        [node_b, node_c]
    )

    {
        const order = indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "g2" },
                { kind: "pick", filter: "l" },
            ]
        }, {}]]).output().order!

        // assert.equal(order.head_data_new()!.value, node_b.value)
        // assert.equal(order.head_compare(0), node_b.value)
        // assert.equal(order.tail_data_new()!.value, node_c.value)
        // assert.equal(order.tail_compare(0), node_c.value)
        assert.equal(order.ref_data_new(node_b)!.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), node_b.value)
        assert.equal(order.ref_data_new(node_c)!.value, node_c.value)
        assert.equal(order.ref_compare(node_c, 0), node_c.value)
        assert.equal(order.ref_data_new(node_a), null)
        assert.equal(order.ref_compare(node_a, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "r" },
                { kind: "pick", filter: "l" },
            ]
        }, {}]]).output()],
        []
    )

    {
        const order = indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "r" },
                { kind: "pick", filter: "l" },
            ]
        }, {}]]).output().order!

        // assert.equal(order.head_data_new(), null)
        // assert.equal(order.head_compare(0), null)
        // assert.equal(order.tail_data_new(), null)
        // assert.equal(order.tail_compare(0), null)
        assert.equal(order.ref_data_new(node_b), null)
        assert.equal(order.ref_compare(node_b, 0), null)
        assert.equal(order.ref_data_new(node_c), null)
        assert.equal(order.ref_compare(node_c, 0), null)
        assert.equal(order.ref_data_new(node_a), null)
        assert.equal(order.ref_compare(node_a, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "l" },
                { kind: "pick", filter: "l" },
            ]
        }, {}]]).output()],
        [node_a, node_b, node_c]
    )

    {
        const order = indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "l" },
                { kind: "pick", filter: "l" },
            ]
        }, {}]]).output().order!

        // assert.equal(order.head_data_new()!.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()!.value, node_c.value)
        // assert.equal(order.tail_compare(0), node_c.value)
        assert.equal(order.ref_data_new(node_b)!.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), node_b.value)
        assert.equal(order.ref_data_new(node_c)!.value, node_c.value)
        assert.equal(order.ref_compare(node_c, 0), node_c.value)
        assert.equal(order.ref_data_new(node_d), null)
        assert.equal(order.ref_compare(node_d, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "intersection",
            children: []
        }, {}]]).output()],
        []
    )

    {
        const order = indexer.filter([null, [{
            kind: "intersection",
            children: []
        }, {}]]).output().order!

        // assert.equal(order.head_data_new()!.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()!.value, node_a.value)
        // assert.equal(order.tail_compare(0), node_a.value)
        assert.equal(order.ref_data_new(node_a), null)
        assert.equal(order.ref_compare(node_a, 0), null)
        assert.equal(order.ref_data_new(node_b), null)
        assert.equal(order.ref_compare(node_b, 0), null)
        assert.equal(order.ref_data_new(node_f), null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "l" },
                { kind: "pick", filter: "g1" },
            ]
        }, {}]]).output()],
        [node_a]
    )

    {
        const order = indexer.filter([null, [{
            kind: "intersection",
            children: [
                { kind: "pick", filter: "l" },
                { kind: "pick", filter: "g1" },
            ]
        }, {}]]).output().order!

        // assert.equal(order.head_data_new()!.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()!.value, node_a.value)
        // assert.equal(order.tail_compare(0), node_a.value)
        assert.equal(order.ref_data_new(node_a)!.value, node_a.value)
        assert.equal(order.ref_compare(node_a, 0), node_a.value)
        assert.equal(order.ref_data_new(node_b), null)
        assert.equal(order.ref_compare(node_b, 0), null)
        assert.equal(order.ref_data_new(node_f), null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }
})

test("indexing list order", () => {
    const node_a = { name: "node_a", value: 0 }
    const node_b = { name: "node_b", value: 1 }
    const node_c = { name: "node_c", value: 2 }
    const node_d = { name: "node_d", value: 3 }
    const node_e = { name: "node_e", value: 4 }
    const node_f = { name: "node_f", value: 5 }

    const indexer = indexer_new_list_sorted<typeof node_a, number>({
        comparator: (a, b) => a - b,
    })

    // add all in random order
    indexer.input_add(node_b, null, node_b.value)
    indexer.input_add(node_c, null, node_c.value)
    indexer.input_add(node_f, null, node_f.value)
    indexer.input_add(node_e, null, node_e.value)
    indexer.input_add(node_a, null, node_a.value)
    indexer.input_add(node_d, null, node_d.value)

    assert.deepStrictEqual(
        [...indexer.filter([null, {

        }]).output()],
        [node_a, node_b, node_c, node_d, node_e, node_f]
    )

    // bound_start
    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_start: {
                inclusive: false,
                value: node_b.value,
            },
        }]).output()],
        [node_c, node_d, node_e, node_f]
    )

    {
        const order = indexer.filter([null, {
            bound_start: {
                inclusive: false,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, node_c.value)
        // assert.equal(order.head_compare(0), node_c.value)
        // assert.equal(order.tail_data_new()?.value, node_f.value)
        // assert.equal(order.tail_compare(0), node_f.value)
        assert.equal(order.ref_data_new(node_c)?.value, node_c.value)
        assert.equal(order.ref_compare(node_c, 0), node_c.value)
        assert.equal(order.ref_data_new(node_b)?.value, null)
        assert.equal(order.ref_compare(node_b, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output()],
        [node_b, node_c, node_d, node_e, node_f]
    )

    {
        const order = indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, node_b.value)
        // assert.equal(order.head_compare(0), node_b.value)
        // assert.equal(order.tail_data_new()?.value, node_f.value)
        // assert.equal(order.tail_compare(0), node_f.value)
        assert.equal(order.ref_data_new(node_b)?.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), node_b.value)
        assert.equal(order.ref_data_new(node_a)?.value, null)
        assert.equal(order.ref_compare(node_a, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_f.value + 1,
            },
        }]).output()],
        []
    )

    {
        const order = indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_f.value + 1,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, null)
        // assert.equal(order.head_compare(0), null)
        // assert.equal(order.tail_data_new()?.value, null)
        // assert.equal(order.tail_compare(0), null)
        assert.equal(order.ref_data_new(node_f)?.value, null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    // bound_end
    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_end: {
                inclusive: false,
                value: node_e.value,
            },
        }]).output()],
        [node_a, node_b, node_c, node_d]
    )

    {
        const order = indexer.filter([null, {
            bound_end: {
                inclusive: false,
                value: node_e.value,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()?.value, node_d.value)
        // assert.equal(order.tail_compare(0), node_d.value)
        assert.equal(order.ref_data_new(node_d)?.value, node_d.value)
        assert.equal(order.ref_compare(node_d, 0), node_d.value)
        assert.equal(order.ref_data_new(node_e)?.value, null)
        assert.equal(order.ref_compare(node_e, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_end: {
                inclusive: true,
                value: node_e.value,
            },
        }]).output()],
        [node_a, node_b, node_c, node_d, node_e]
    )

    {
        const order = indexer.filter([null, {
            bound_end: {
                inclusive: true,
                value: node_e.value,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, node_a.value)
        // assert.equal(order.head_compare(0), node_a.value)
        // assert.equal(order.tail_data_new()?.value, node_e.value)
        // assert.equal(order.tail_compare(0), node_e.value)
        assert.equal(order.ref_data_new(node_e)?.value, node_e.value)
        assert.equal(order.ref_compare(node_e, 0), node_e.value)
        assert.equal(order.ref_data_new(node_f)?.value, null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_end: {
                inclusive: true,
                value: -1,
            },
        }]).output()],
        []
    )

    {
        const order = indexer.filter([null, {
            bound_end: {
                inclusive: true,
                value: -1,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, null)
        // assert.equal(order.head_compare(0), null)
        // assert.equal(order.tail_data_new()?.value, null)
        // assert.equal(order.tail_compare(0), null)
        assert.equal(order.ref_data_new(node_f)?.value, null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    // two bounds
    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_b.value,
            },

            bound_end: {
                inclusive: true,
                value: node_c.value,
            },
        }]).output()],
        [node_b, node_c]
    )

    {
        const order = indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_b.value,
            },

            bound_end: {
                inclusive: true,
                value: node_c.value,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, node_b.value)
        // assert.equal(order.head_compare(0), node_b.value)
        // assert.equal(order.tail_data_new()?.value, node_c.value)
        // assert.equal(order.tail_compare(0), node_c.value)
        assert.equal(order.ref_data_new(node_c)?.value, node_c.value)
        assert.equal(order.ref_compare(node_c, 0), node_c.value)
        assert.equal(order.ref_data_new(node_a)?.value, null)
        assert.equal(order.ref_compare(node_a, 0), null)
        assert.equal(order.ref_data_new(node_d)?.value, null)
        assert.equal(order.ref_compare(node_d, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_b.value,
            },

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output()],
        [node_b]
    )

    {
        const order = indexer.filter([null, {
            bound_start: {
                inclusive: true,
                value: node_b.value,
            },

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, node_b.value)
        // assert.equal(order.head_compare(0), node_b.value)
        // assert.equal(order.tail_data_new()?.value, node_b.value)
        // assert.equal(order.tail_compare(0), node_b.value)
        assert.equal(order.ref_data_new(node_b)?.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), node_b.value)
        assert.equal(order.ref_data_new(node_a)?.value, null)
        assert.equal(order.ref_compare(node_a, 0), null)
        assert.equal(order.ref_data_new(node_d)?.value, null)
        assert.equal(order.ref_compare(node_d, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            bound_start: {
                inclusive: false,
                value: node_b.value,
            },

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output()],
        []
    )

    {
        const order = indexer.filter([null, {
            bound_start: {
                inclusive: false,
                value: node_b.value,
            },

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.head_data_new()?.value, null)
        // assert.equal(order.head_compare(0), null)
        // assert.equal(order.tail_data_new()?.value, null)
        // assert.equal(order.tail_compare(0), null)
        assert.equal(order.ref_data_new(node_b)?.value, null)
        assert.equal(order.ref_compare(node_b, 0), null)
    }

    // SECTION_REVERSE
    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,
        }]).output()],
        [node_a, node_b, node_c, node_d, node_e, node_f].reverse()
    )

    // bound_end
    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: false,
                value: node_b.value,
            },
        }]).output()],
        [node_c, node_d, node_e, node_f].reverse()
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: false,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, node_c.value)
        // assert.equal(order.tail_compare(0), -node_c.value)
        // assert.equal(order.head_data_new()?.value, node_f.value)
        // assert.equal(order.head_compare(0), -node_f.value)
        assert.equal(order.ref_data_new(node_c)?.value, node_c.value)
        assert.equal(order.ref_compare(node_c, 0), -node_c.value)
        assert.equal(order.ref_data_new(node_b)?.value, null)
        assert.equal(order.ref_compare(node_b, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output()],
        [node_b, node_c, node_d, node_e, node_f].reverse()
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, node_b.value)
        // assert.equal(order.tail_compare(0), -node_b.value)
        // assert.equal(order.head_data_new()?.value, node_f.value)
        // assert.equal(order.head_compare(0), -node_f.value)
        assert.equal(order.ref_data_new(node_b)?.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), -node_b.value)
        assert.equal(order.ref_data_new(node_a)?.value, null)
        assert.equal(order.ref_compare(node_a, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_f.value + 1,
            },
        }]).output()],
        []
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_f.value + 1,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, null)
        // assert.equal(order.tail_compare(0), null)
        // assert.equal(order.head_data_new()?.value, null)
        // assert.equal(order.head_compare(0), null)
        assert.equal(order.ref_data_new(node_f)?.value, null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    // bound_end
    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_start: {
                inclusive: false,
                value: node_e.value,
            },
        }]).output()],
        [node_a, node_b, node_c, node_d].reverse()
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_start: {
                inclusive: false,
                value: node_e.value,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, node_a.value)
        // assert.equal(order.tail_compare(0), -node_a.value)
        // assert.equal(order.head_data_new()?.value, node_d.value)
        // assert.equal(order.head_compare(0), -node_d.value)
        assert.equal(order.ref_data_new(node_d)?.value, node_d.value)
        assert.equal(order.ref_compare(node_d, 0), -node_d.value)
        assert.equal(order.ref_data_new(node_e)?.value, null)
        assert.equal(order.ref_compare(node_e, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_start: {
                inclusive: true,
                value: node_e.value,
            },
        }]).output()],
        [node_a, node_b, node_c, node_d, node_e].reverse()
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_start: {
                inclusive: true,
                value: node_e.value,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, node_a.value)
        // assert.equal(order.tail_compare(0), -node_a.value)
        // assert.equal(order.head_data_new()?.value, node_e.value)
        // assert.equal(order.head_compare(0), -node_e.value)
        assert.equal(order.ref_data_new(node_e)?.value, node_e.value)
        assert.equal(order.ref_compare(node_e, 0), -node_e.value)
        assert.equal(order.ref_data_new(node_f)?.value, null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_start: {
                inclusive: true,
                value: -1,
            },
        }]).output()],
        []
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_start: {
                inclusive: true,
                value: -1,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, null)
        // assert.equal(order.tail_compare(0), null)
        // assert.equal(order.head_data_new()?.value, null)
        // assert.equal(order.head_compare(0), null)
        assert.equal(order.ref_data_new(node_f)?.value, null)
        assert.equal(order.ref_compare(node_f, 0), null)
    }

    // two bounds
    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },

            bound_start: {
                inclusive: true,
                value: node_c.value,
            },
        }]).output()],
        [node_b, node_c].reverse()
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },

            bound_start: {
                inclusive: true,
                value: node_c.value,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, node_b.value)
        // assert.equal(order.tail_compare(0), -node_b.value)
        // assert.equal(order.head_data_new()?.value, node_c.value)
        // assert.equal(order.head_compare(0), -node_c.value)
        assert.equal(order.ref_data_new(node_c)?.value, node_c.value)
        assert.equal(order.ref_compare(node_c, 0), -node_c.value)
        assert.equal(order.ref_data_new(node_a)?.value, null)
        assert.equal(order.ref_compare(node_a, 0), null)
        assert.equal(order.ref_data_new(node_d)?.value, null)
        assert.equal(order.ref_compare(node_d, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },

            bound_start: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output()],
        [node_b].reverse()
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: true,
                value: node_b.value,
            },

            bound_start: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, node_b.value)
        // assert.equal(order.tail_compare(0), -node_b.value)
        // assert.equal(order.head_data_new()?.value, node_b.value)
        // assert.equal(order.head_compare(0), -node_b.value)
        assert.equal(order.ref_data_new(node_b)?.value, node_b.value)
        assert.equal(order.ref_compare(node_b, 0), -node_b.value)
        assert.equal(order.ref_data_new(node_a)?.value, null)
        assert.equal(order.ref_compare(node_a, 0), null)
        assert.equal(order.ref_data_new(node_d)?.value, null)
        assert.equal(order.ref_compare(node_d, 0), null)
    }

    assert.deepStrictEqual(
        [...indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: false,
                value: node_b.value,
            },

            bound_start: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output()],
        []
    )

    {
        const order = indexer.filter([null, {
            reverse: true,

            bound_end: {
                inclusive: false,
                value: node_b.value,
            },

            bound_start: {
                inclusive: true,
                value: node_b.value,
            },
        }]).output().order!

        // assert.equal(order.tail_data_new()?.value, null)
        // assert.equal(order.tail_compare(0), null)
        // assert.equal(order.head_data_new()?.value, null)
        // assert.equal(order.head_compare(0), null)
        assert.equal(order.ref_data_new(node_b)?.value, null)
        assert.equal(order.ref_compare(node_b, 0), null)
    }
})
