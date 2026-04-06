import type { RBTree_Node, RBTree_Root } from "#src/util/rbtree/type/node.js";

export const rbtree_rotate_left = function <Data, Content>(
    root: RBTree_Root<Data, Content>, node: RBTree_Node<Data, Content>
): void {
    // assume it exists
    const node_r = node.right
    if (node_r === null) { return }

    // r-l to r
    node.right = node_r.left

    if (node_r.left !== null) {
        node_r.left.parent = node
    }

    // r to -
    node_r.parent = node.parent

    if (node.parent === null) {
        root.node = node_r
    } else if (node === node.parent.left) {
        node.parent.left = node_r
    } else {
        node.parent.right = node_r
    }

    // - to l
    node_r.left = node
    node.parent = node_r
}

export const rbtree_rotate_right = function <Data, Content>(
    root: RBTree_Root<Data, Content>, node: RBTree_Node<Data, Content>
): void {
    // assume it exists
    const node_l = node.left
    if (node_l === null) { return }

    // l-r to l
    node.left = node_l.right

    if (node_l.right !== null) {
        node_l.right.parent = node
    }

    // l to -
    node_l.parent = node.parent

    if (node.parent === null) {
        root.node = node_l
    } else if (node === node.parent.left) {
        node.parent.left = node_l
    } else {
        node.parent.right = node_l
    }

    // - to r
    node_l.right = node
    node.parent = node_l
}
