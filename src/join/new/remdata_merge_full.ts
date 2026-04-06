import { join_new_filtero } from "#src/join/new/filtero.js"
import { join_new_pipeo_data } from "#src/join/new/pipeo_data.js"
import { join_new_remnode_merge, type Join_NewRemNodeMerge_Joins, type Join_NewRemNodeMerge_Joins_G, type Join_NewRemNodeMerge_Params } from "#src/join/new/remnode_merge.js"
import { type Join, type JoinF } from "#src/join/type/join.js"
import type { Join_RemNodeMerge_Full } from "#src/join/type/remnode_merge.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"

export type Join_NewRemDataMergeFull_Params<
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNodeMerge_Joins_G<RDef>
> = Join_NewRemNodeMerge_Params<Param, RDef, Joins>

export const join_new_remdata_merge_full = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNodeMerge_Joins_G<RDef>
>(
    params: Join_NewRemDataMergeFull_Params<Param, RDef, Joins>
): Join<Param, Join_RemNodeMerge_Full<RDef, Join_NewRemNodeMerge_Joins<RDef, Joins>>["data"]> {
    return join_new_filtero({
        filter: output => output !== null,

        join: join_new_pipeo_data({
            join: join_new_remnode_merge(params)
        }),
    })
}

export const join_newf_remdata_merge_full = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNodeMerge_Joins_G<RDef>
>(
    params: Join_NewRemDataMergeFull_Params<Param, RDef, Joins>
): JoinF<Param, Join_RemNodeMerge_Full<RDef, Join_NewRemNodeMerge_Joins<RDef, Joins>>["data"]> {
    const result = join_new_remdata_merge_full(params)

    return () => result
}

export const join_news_remdata_merge_full = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNodeMerge_Joins_G<RDef>
>(
    link_new: (param: Param) => RemNode<RDef>,
    joins: Joins
): JoinF<Param, Join_RemNodeMerge_Full<RDef, Join_NewRemNodeMerge_Joins<RDef, Joins>>["data"]> {
    const result = join_new_remdata_merge_full({
        link_new,
        joins,
    })

    return () => result
}
