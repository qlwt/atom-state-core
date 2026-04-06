import { join_new_filtero_withdata } from "#src/join/new/filtero_withdata.js"
import { join_new_remnode, type Join_NewRemNode_Joins, type Join_NewRemNode_Joins_G, type Join_NewRemNode_Params } from "#src/join/new/remnode.js"
import { type Join, type JoinF } from "#src/join/type/join.js"
import type { Join_RemNode_Full } from "#src/join/type/remnode.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"

export type Join_NewRemNodeFull_Params<
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
> = Join_NewRemNode_Params<Param, RDef, Joins>

export const join_new_remnode_full = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
>(
    params: Join_NewRemNodeFull_Params<Param, RDef, Joins>
): Join<Param, Join_RemNode_Full<RDef, Join_NewRemNode_Joins<RDef, Joins>>> {
    return join_new_filtero_withdata({
        join: join_new_remnode(params),
    })
}

export const join_newf_remnode_full = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
>(
    params: Join_NewRemNodeFull_Params<Param, RDef, Joins>
): JoinF<Param, Join_RemNode_Full<RDef, Join_NewRemNode_Joins<RDef, Joins>>> {
    const result = join_new_remnode_full(params)

    return () => result
}

export const join_news_remnode_full = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
>(
    link_new: (param: Param) => RemNode<RDef>,
    joins: Joins
): JoinF<Param, Join_RemNode_Full<RDef, Join_NewRemNode_Joins<RDef, Joins>>> {
    const result = join_new_remnode_full({
        link_new,
        joins,
    })

    return () => result
}
