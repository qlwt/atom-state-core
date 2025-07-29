import type { AtomRemNode__Data } from "#src/atom/remnode/type/Data.js";
import type { AtomRemNode_Def } from "#src/atom/remnode/type/State.js";
import type { AtomStore } from "#src/atom/store/type/AtomStore.js";
import * as sc from "@qyu/signal-core";

type Override<A extends object, B extends object> = Omit<A, keyof B> & B

export type AtomRemNode_Join_Factory<Param, Result> = {
    (store: AtomStore): AtomRemNode_Join_Resolver<Param, Result>
}

export type AtomRemNode_Join_Resolver<Param, Result> = {
    (params: Param): sc.OSignal<Result | null>
}

export type AtomRemNode_Join<
    Def extends AtomRemNode_Def,
    Properties extends Partial<Readonly<Record<keyof Def["data"], any>>>
> = AtomRemNode__Data<Override<Def, Readonly<{
    data: Override<Def["data"], Readonly<{
        [K in keyof Properties]: Properties[K]
    }>>
}>>>
