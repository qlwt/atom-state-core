import type { Value_Atom } from "#src/value/type/value.js"

export type Loader<Param> = {
    readonly request: (param: Param) => VoidFunction
}

export type Loader_Atom<Param> = Value_Atom<Loader<Param>>
