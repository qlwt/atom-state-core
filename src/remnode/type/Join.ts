import type { AtomRemNode__Data, AtomRemNode__Data_Full } from "#src/remnode/type/Data.js";
import type { AtomRemNode_Def } from "#src/remnode/type/State.js";
import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js";
import * as sc from "@qyu/signal-core";

type Override<A extends object, B extends object> = Omit<A, keyof B> & B

export type AtomRemNode_Join_Factory<Param, Result> = (
    AtomSelectorStatic<AtomRemNode_Join_Resolver<Param, Result>>
)

export type AtomRemNode_Join_Resolver<Param, Result> = {
    (params: Param): sc.OSignal<Result | null>
}

export type AtomRemNode_Join_Required<Raw extends AtomRemNode_Join<any, any>> = (
    AtomRemNode_JoinFull<
        Raw extends AtomRemNode__Data<infer T> ? T : never,
        {}
    >
)

// basically overrides .data with Properties
export type AtomRemNode_Join<
    Def extends AtomRemNode_Def,
    Properties extends Readonly<Record<keyof any, any>>
> = AtomRemNode__Data<Override<Def, {
    data: Override<Def["data"], Properties>
}>>

export type AtomRemNode_JoinFull<
    Def extends AtomRemNode_Def,
    Properties extends Readonly<Record<keyof any, any>>
> = AtomRemNode__Data_Full<Override<Def, {
    data: Override<Def["data"], Properties>
}>>
