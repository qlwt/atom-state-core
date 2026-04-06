import { rbtree_delete } from "#src/util/rbtree/delete.js"
import { rbtree_insert } from "#src/util/rbtree/insert.js"
import { rbtree_traverse_direct, rbtree_traverse_reverse } from "#src/util/rbtree/traverse.js"
import type { RBTree_Root } from "#src/util/rbtree/type/node.js"
import { assert, test } from "vitest"

test("rbtree basic", () => {
    const root: RBTree_Root<number, number> = {
        node: null,
        comparator: (a, b) => a - b,
    }

    assert.deepStrictEqual([...rbtree_traverse_direct(root)], [])

    rbtree_insert(root, 10, 10)
    rbtree_insert(root, 50, 50)
    rbtree_insert(root, 80, 80)
    rbtree_insert(root, 15, 15)
    rbtree_insert(root, 40, 40)
    rbtree_insert(root, 90, 90)
    rbtree_insert(root, 25, 25)
    rbtree_insert(root, 100, 100)

    assert.deepStrictEqual([...rbtree_traverse_direct(root)], [10, 15, 25, 40, 50, 80, 90, 100])
    assert.deepStrictEqual([...rbtree_traverse_reverse(root)], [10, 15, 25, 40, 50, 80, 90, 100].reverse())
})

test("rbtree delete", () => {
    const root: RBTree_Root<number, number> = {
        node: null,
        comparator: (a, b) => a - b,
    }

    rbtree_insert(root, 10, 10)
    rbtree_insert(root, 50, 50)
    rbtree_insert(root, 80, 80)
    rbtree_insert(root, 15, 15)
    rbtree_insert(root, 40, 40)
    rbtree_insert(root, 90, 90)
    rbtree_insert(root, 25, 25)
    rbtree_insert(root, 100, 100)

    rbtree_delete(root, 10)
    rbtree_delete(root, 50)
    rbtree_delete(root, 80)
    rbtree_delete(root, 15)

    assert.deepStrictEqual([...rbtree_traverse_direct(root)], [25, 40, 90, 100])
})
