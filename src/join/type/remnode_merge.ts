import type { RemNode_Def } from "#src/remnode/type/def.js"
import type { RemView_Full } from "#src/remview/type/view.js"

export type Join_RemNodeMerge<RDef extends RemNode_Def, Joins extends {}> = {
    readonly meta: RemView_Full<RDef>["meta"]

    readonly data: null | (Omit<RemView_Full<RDef>["data"], keyof Joins> & Joins)
}

export type Join_RemNodeMerge_Full<RDef extends RemNode_Def, Joins extends {}> = {
    readonly meta: RemView_Full<RDef>["meta"]
    readonly data: Omit<RemView_Full<RDef>["data"], keyof Joins> & Joins
}

export type Join_RemNodeMerge_Filled<Node extends Join_RemNodeMerge<any, any>> = (
    Node extends Join_RemNodeMerge<infer RDef, infer Joins> ? Join_RemNodeMerge_Full<RDef, Joins> : never
)
