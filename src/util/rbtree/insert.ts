import { rbtree_rotate_left, rbtree_rotate_right } from "#src/util/rbtree/rotate.js";
import { RBTree_Color, type RBTree_Node, type RBTree_Root } from "#src/util/rbtree/type/node.js";

export const rbtree_insert = function <Data, Content>(
    root: RBTree_Root<Data, Content>, data: Data, content: Content
): void {
    if (root.node === null) {
        root.node = {
            data,
            content,
            color: RBTree_Color.Black,
            left: null,
            right: null,
            parent: null,
        }

        return
    }

    let current = root.node

    while (true) {
        const diff = root.comparator(data, current.data)

        if (diff < 0) {
            if (current.left) {
                current = current.left
            } else {
                current.left = {
                    data,
                    content,

                    parent: current,
                    color: RBTree_Color.Red,

                    left: null,
                    right: null
                }

                rbtree_insert_fix(root, current.left)

                break
            }
        } else {
            if (current.right) {
                current = current.right
            } else {
                current.right = {
                    data,
                    content,

                    parent: current,
                    color: RBTree_Color.Red,

                    left: null,
                    right: null
                }

                rbtree_insert_fix(root, current.right)

                break
            }
        }
    }
}

const rbtree_insert_fix = function <Data, Content>(
    root: RBTree_Root<Data, Content>, node: RBTree_Node<Data, Content>
): void {
    let current = node

    while (current.parent !== null && current.parent.color === RBTree_Color.Red) {
        const parent = current.parent
        const parent_parent = parent.parent

        if (parent_parent === null) break

        if (parent === parent_parent.left) {
            const uncle = parent_parent.right

            if (uncle !== null && uncle.color === RBTree_Color.Red) {
                // uncle is red - recolor
                // parent sets to red
                parent_parent.color = RBTree_Color.Red

                // both children are to black
                uncle.color = RBTree_Color.Black
                parent.color = RBTree_Color.Black

                // check parent_parent
                current = parent_parent
            } else {
                // current is right child - rotate left
                if (current === parent.right) {
                    current = parent

                    rbtree_rotate_left(root, current)
                }

                // current is left child - rotate right
                current.parent!.color = RBTree_Color.Black
                parent_parent.color = RBTree_Color.Red

                rbtree_rotate_right(root, parent_parent)
            }
        } else {
            const uncle = parent_parent.left

            // uncle is red - recolor
            if (uncle !== null && uncle.color === RBTree_Color.Red) {
                // parent_parent to red
                parent_parent.color = RBTree_Color.Red

                // both children to black
                parent.color = RBTree_Color.Black
                uncle.color = RBTree_Color.Black

                // check parent_parent
                current = parent_parent
            } else {
                // current is left child - rotate right
                if (current === parent.left) {
                    current = parent

                    rbtree_rotate_right(root, current)
                }

                // current is right child - rotate left
                current.parent!.color = RBTree_Color.Black
                parent_parent.color = RBTree_Color.Red

                rbtree_rotate_left(root, parent_parent)
            }
        }
    }

    if (root.node !== null) {
        root.node.color = RBTree_Color.Black
    }
}
