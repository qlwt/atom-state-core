import type { RBTree_Node, RBTree_Root } from "#src/util/rbtree/type/node.js";

export const rbtree_edge_right = function <Data, Content>(
    root: RBTree_Root<Data, Content>
): RBTree_Node<Data, Content> | null {
    let current = root.node

    while (current !== null && current.right !== null) {
        current = current.right
    }

    return current
}

export const rbtree_edge_left = function <Data, Content>(
    root: RBTree_Root<Data, Content>
): RBTree_Node<Data, Content> | null {
    let current = root.node

    while (current !== null && current.left !== null) {
        current = current.left
    }

    return current
}
