import type { RBTree_Color, RBTree_Node } from "#src/util/rbtree/type/node.js";

export const rbtree_node_new = function <Data, Content>(
    data: Data, content: Content, color: RBTree_Color
): RBTree_Node<Data, Content> {
    return {
        data,
        color,
        content,
        left: null,
        right: null,
        parent: null,
    }
}
