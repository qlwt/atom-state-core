import type { AtomRemNode__Data } from "#src/atom/remnode/type/Data.js";
import type { AtomRemNode_Def } from "#src/atom/remnode/type/State.js";
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js";
import * as sc from "@qyu/signal-core";

type Override<A extends object, B extends object> = Omit<A, keyof B> & B

export type AtomRemNode_Join_Factory<Param, Result> = (
    AtomSelectorStatic<AtomRemNode_Join_Resolver<Param, Result>>
)

export type AtomRemNode_Join_Resolver<Param, Result> = {
    (params: Param): sc.OSignal<Result | null>
}

// basically overrides .data with Properties
export type AtomRemNode_Join<
    Def extends AtomRemNode_Def,
    Properties extends Readonly<Record<keyof any, any>>
> = AtomRemNode__Data<Override<Def, {
    data: Override<Def["data"], Properties>
}>>
