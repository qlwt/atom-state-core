import type { RBTree_BoundPairOptional, RBTree_Node, RBTree_Root } from "#src/util/rbtree/type/node.js"

export const rbtree_traverse_direct = function*<Data, Content>(root: RBTree_Root<Data, Content>): IterableIterator<Content> {
    const stack: RBTree_Node<Data, Content>[] = []

    let current = root.node

    while (current !== null || stack.length > 0) {
        while (current !== null) {
            stack.push(current)
            current = current.left
        }

        current = stack.pop()!

        yield current.content

        current = current.right
    }
}

export const rbtree_traverse_reverse = function*<Data, Content>(root: RBTree_Root<Data, Content>): IterableIterator<Content> {
    const stack: RBTree_Node<Data, Content>[] = []
    let current = root.node

    while (current !== null || stack.length > 0) {
        while (current !== null) {
            stack.push(current)
            current = current.right
        }

        current = stack.pop()!

        yield current.content

        current = current.left
    }
}

export const rbtree_traverse_direct_inbound = function*<Data, Content>(
    root: RBTree_Root<Data, Content>, bounds: RBTree_BoundPairOptional<Data>
): IterableIterator<Content> {
    const stack: RBTree_Node<Data, Content>[] = []

    let current = root.node

    while (current !== null || stack.length > 0) {
        if (bounds.start) {
            if (bounds.start.inclusive) {
                while (current !== null) {
                    const diff = root.comparator(current.data, bounds.start.value)

                    if (diff >= 0) {
                        stack.push(current)
                        current = current.left

                        continue
                    }

                    current = current.right
                }
            } else {
                while (current !== null) {
                    if (root.comparator(current.data, bounds.start.value) > 0) {
                        stack.push(current)
                        current = current.left

                        continue
                    }

                    current = current.right
                }
            }
        } else {
            while (current !== null) {
                stack.push(current)
                current = current.left
            }
        }

        current = stack.pop() ?? null

        if (!current) {
            return
        }

        if (bounds.end) {
            if (bounds.end.inclusive) {
                if (root.comparator(current.data, bounds.end.value) > 0) {
                    return
                }
            } else {
                if (root.comparator(current.data, bounds.end.value) >= 0) {
                    return
                }
            }
        }

        yield current.content

        current = current.right
    }
}

export const rbtree_traverse_reverse_inbound = function*<Data, Content>(
    root: RBTree_Root<Data, Content>, bounds: RBTree_BoundPairOptional<Data>
): IterableIterator<Content> {
    const stack: RBTree_Node<Data, Content>[] = []

    let current = root.node

    while (current !== null || stack.length > 0) {
        if (bounds.start) {
            if (bounds.start.inclusive) {
                while (current !== null) {
                    const diff = root.comparator(current.data, bounds.start.value)

                    if (diff <= 0) {
                        stack.push(current)
                        current = current.right

                        continue
                    }

                    current = current.left
                }
            } else {
                while (current !== null) {
                    if (root.comparator(current.data, bounds.start.value) < 0) {
                        stack.push(current)
                        current = current.right

                        continue
                    }

                    current = current.left
                }
            }
        } else {
            while (current !== null) {
                stack.push(current)
                current = current.right
            }
        }

        current = stack.pop() ?? null

        if (!current) {
            return
        }

        if (bounds.end) {
            if (bounds.end.inclusive) {
                if (root.comparator(current.data, bounds.end.value) < 0) {
                    return
                }
            } else {
                if (root.comparator(current.data, bounds.end.value) <= 0) {
                    return
                }
            }
        }

        yield current.content

        current = current.left
    }
}
