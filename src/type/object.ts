export type Modifiable<T extends {}> = {
    -readonly [K in keyof T]: T[K]
}

export type ModifiableDeep<T> = T extends {} ? {
    -readonly [K in keyof T]: ModifiableDeep<T[K]>
} : T

export type PartialDeep<T> = T extends {} ? {
    [K in keyof T]?: PartialDeep<T[K]>
} : T
