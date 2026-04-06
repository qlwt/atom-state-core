export type RBTree_Root<Data, Content> = {
    node: RBTree_Node<Data, Content> | null

    readonly comparator: RBTree_Comparator<Data>
}

export type RBTree_Comparator<T> = {
    (a: T, b: T): number
}

export const enum RBTree_Color {
    Red,
    Black
}

export const RBTree_Color_TwoBlack = RBTree_Color.Black + RBTree_Color.Black
export const RBTree_Color_Mix = RBTree_Color.Red + RBTree_Color.Black
export const RBTree_Color_TwoRed = RBTree_Color.Red + RBTree_Color.Red

export type RBTree_Node<Data, Content> = {
    data: Data
    content: Content
    color: RBTree_Color
    left: RBTree_Node<Data, Content> | null
    right: RBTree_Node<Data, Content> | null
    parent: RBTree_Node<Data, Content> | null
}

export type RBTree_Bound<Data> = {
    readonly value: Data
    readonly inclusive?: boolean
}

export type RBTree_BoundPair<Data> = {
    readonly start: RBTree_Bound<Data>
    readonly end: RBTree_Bound<Data>
}

export type RBTree_BoundPairOptional<Data> = {
    readonly end?: RBTree_Bound<Data> | null
    readonly start?: RBTree_Bound<Data> | null
}
