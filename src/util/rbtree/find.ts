import { rbtree_edge_left, rbtree_edge_right } from "#src/util/rbtree/edge.js"
import type { RBTree_Bound, RBTree_Node, RBTree_Root } from "#src/util/rbtree/type/node.js"

export const rbtree_find_before = function <Data, Content>(
    root: RBTree_Root<Data, Content>, bound?: RBTree_Bound<Data> | null
): RBTree_Node<Data, Content> | null {
    if (!bound) {
        return rbtree_edge_right(root)
    }

    let best: RBTree_Node<Data, Content> | null = null
    let current = root.node

    if (bound.inclusive) {
        while (current !== null) {
            const diff = root.comparator(current.data, bound.value)

            if (diff <= 0) {
                // current.value <= bound.value
                best = current
                current = current.right
            } else {
                current = current.left
            }
        }
    } else {
        while (current !== null) {
            const diff = root.comparator(current.data, bound.value)

            if (diff < 0) {
                // current.value < bound.value
                best = current
                current = current.right
            } else {
                current = current.left
            }
        }
    }

    return best
}

export const rbtree_find_after = function <Data, Content>(
    root: RBTree_Root<Data, Content>, bound?: RBTree_Bound<Data> | null
): RBTree_Node<Data, Content> | null {
    if (!bound) {
        return rbtree_edge_left(root)
    }

    let best: RBTree_Node<Data, Content> | null = null
    let current = root.node

    if (bound.inclusive) {
        while (current !== null) {
            const diff = root.comparator(current.data, bound.value)

            if (diff >= 0) {
                // current.value >= bound.value
                best = current
                current = current.left
            } else {
                current = current.right
            }
        }
    } else {
        while (current !== null) {
            const diff = root.comparator(current.data, bound.value)

            if (diff > 0) {
                // current.value > bound.value
                best = current
                current = current.left
            } else {
                current = current.right
            }
        }
    }

    return best
}
