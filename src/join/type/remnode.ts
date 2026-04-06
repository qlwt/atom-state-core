import type { RemNode_Def } from "#src/remnode/type/def.js"
import type { RemView_Full } from "#src/remview/type/view.js"

export type Join_RemNode<RDef extends RemNode_Def, Joins extends {}> = {
    readonly meta: RemView_Full<RDef>["meta"]

    readonly data: null | {
        readonly joins: Joins
        readonly core: RemView_Full<RDef>["data"]
    }
}

export type Join_RemNode_Full<RDef extends RemNode_Def, Joins extends {}> = {
    readonly meta: RemView_Full<RDef>["meta"]

    readonly data: {
        readonly joins: Joins
        readonly core: RemView_Full<RDef>["data"]
    }
}

export type Join_RemNode_Filled<Node extends Join_RemNode<any, any>> = (
    Node extends Join_RemNode<infer RDef, infer Joins> ? Join_RemNode_Full<RDef, Joins> : never
)
