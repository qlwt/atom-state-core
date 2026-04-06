import { rbtree_rotate_left, rbtree_rotate_right } from "#src/util/rbtree/rotate.js"
import { RBTree_Color, RBTree_Color_TwoBlack, type RBTree_Node, type RBTree_Root } from "#src/util/rbtree/type/node.js"

export const rbtree_delete = function <Data, Content>(root: RBTree_Root<Data, Content>, data: Data): void {
    const target = find(root, data)

    if (target === null) {
        return
    }

    if (target.left === null) {
        // free left slot
        // detach target in favor of target.right
        transplant(root, target, target.right)

        // if removed node was black - fix
        if (target.color === RBTree_Color.Black) {
            rbtree_delete_fix(root, target.right, target.parent)
        }
    } else if (target.right === null) {
        // free right slot
        // detach target in favor of target.left
        transplant(root, target, target.left)

        // if removed node was black - fix
        if (target.color === RBTree_Color.Black) {
            rbtree_delete_fix(root, target.left, target.parent)
        }
    } else {
        // both slots taken
        // get leftmost child of target.right
        const next = minimum(target.right)
        const next_color = next.color

        const next_right = next.right
        let next_right_parent = next.parent

        if (next.parent === target) {
            // special case target.right has no left children
            next_right_parent = next
        } else {
            // remnode is guaranteed to not have left slot empty
            // detach remnode, move remnode.right in its place
            transplant(root, next, next.right)

            // prepare for next to be attached at target's position
            next.right = target.right

            if (next.right) {
                next.right.parent = next
            }
        }

        // detach target, move remnode in its place
        transplant(root, target, next)

        // attach target.left to next.left
        next.left = target.left

        if (next.left) {
            next.left.parent = next
        }

        // next adopts target's color
        next.color = target.color

        // if removed node was black - fix
        if (next_color === RBTree_Color.Black) {
            rbtree_delete_fix(root, next_right, next_right_parent)
        }
    }
}

const rbtree_delete_fix = function <Data, Content>(
    root: RBTree_Root<Data, Content>, init_node: RBTree_Node<Data, Content> | null, init_parent: RBTree_Node<Data, Content> | null
): void {
    let current = init_node
    let current_parent = init_parent

    while (current !== root.node && color_new(current) === RBTree_Color.Black) {
        if (!current_parent || current === current_parent.left) {
            let sibling = current_parent?.right ?? null

            if (color_new(sibling) === RBTree_Color.Red) {
                // sibling is red
                sibling!.color = RBTree_Color.Black
                current_parent!.color = RBTree_Color.Red

                rbtree_rotate_left(root, current_parent!)

                sibling = current_parent!.right
            }

            if (color_new(sibling?.right) + color_new(sibling?.left) === RBTree_Color_TwoBlack) {
                // sibling black, both children black
                if (sibling) {
                    sibling.color = RBTree_Color.Red
                }

                current = current_parent
                current_parent = current_parent?.parent ?? null
            } else {
                if (color_new(sibling?.right) === RBTree_Color.Black) {
                    // sibling black, far child black, near child red
                    if (sibling?.left) {
                        sibling.left.color = RBTree_Color.Black
                    }

                    if (sibling) {
                        sibling.color = RBTree_Color.Red

                        rbtree_rotate_right(root, sibling)
                    }

                    sibling = current_parent!.right
                }

                if (sibling) {
                    // sibling black, far child red
                    sibling.color = current_parent!.color
                }

                current_parent!.color = RBTree_Color.Black

                if (sibling?.right) {
                    sibling.right.color = RBTree_Color.Black
                }

                rbtree_rotate_left(root, current_parent!)

                current = root.node

                break
            }
        } else {
            let sibling = current_parent?.left ?? null

            if (color_new(sibling) === RBTree_Color.Red) {
                // sibling is red
                sibling!.color = RBTree_Color.Black
                current_parent!.color = RBTree_Color.Red

                rbtree_rotate_right(root, current_parent!)

                sibling = current_parent!.left
            }

            if (color_new(sibling?.right) + color_new(sibling?.left) === RBTree_Color_TwoBlack) {
                // sibling is black, both children black
                if (sibling) {
                    sibling.color = RBTree_Color.Red
                }

                current = current_parent
                current_parent = current_parent?.parent ?? null
            } else {
                if (color_new(sibling?.left) === RBTree_Color.Black) {
                    // sibling black, far child black, near child red
                    if (sibling?.right) {
                        sibling.right.color = RBTree_Color.Black
                    }

                    if (sibling) {
                        sibling.color = RBTree_Color.Red

                        rbtree_rotate_left(root, sibling)
                    }

                    sibling = current_parent!.left
                }

                if (sibling) {
                    // sibling black, far child red
                    sibling.color = current_parent!.color
                }

                current_parent!.color = RBTree_Color.Black

                if (sibling?.left) {
                    sibling.left.color = RBTree_Color.Black
                }

                rbtree_rotate_right(root, current_parent!)

                current = root.node

                break
            }
        }
    }

    if (current) {
        current.color = RBTree_Color.Black
    }
}

const transplant = function <Data, Content>(
    root: RBTree_Root<Data, Content>, node: RBTree_Node<Data, Content>, now_node: RBTree_Node<Data, Content> | null
): void {
    if (node.parent === null) {
        root.node = now_node
    } else if (node === node.parent.left) {
        node.parent.left = now_node
    } else {
        node.parent.right = now_node
    }

    if (now_node !== null) {
        now_node.parent = node.parent
    }
}

const minimum = function <Data, Content>(node: RBTree_Node<Data, Content>): RBTree_Node<Data, Content> {
    let current = node

    while (current.left !== null) {
        current = current.left
    }

    return current
}

const find = function <Data, Content>(
    root: RBTree_Root<Data, Content>, value: Data
): RBTree_Node<Data, Content> | null {
    let current = root.node

    while (current !== null) {
        const diff = root.comparator(value, current.data)

        if (diff === 0) {
            return current
        } else if (diff < 0) {
            current = current.left
        } else {
            current = current.right
        }
    }

    return null
}

const color_new = function <Data, Content>(node: RBTree_Node<Data, Content> | null | undefined): RBTree_Color {
    if (node) {
        return node.color
    }

    return RBTree_Color.Black
}
