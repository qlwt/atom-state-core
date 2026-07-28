import { Join_Option_Kind, type Join, type Join_Option, type Join_Option_InferValue, type JoinF } from "#src/join/type/join.js"
import type { Join_RemNode } from "#src/join/type/remnode.js"
import type { RemNode, RemNode_Def, RemNode_Meta } from "#src/remnode/type/def.js"
import type { RemOpt, RemOpt_State } from "#src/remopt/type/remopt.js"
import { remview_new_node } from "#src/remview/new/node.js"
import { remview_new_raw } from "#src/remview/new/raw.js"
import type { RemView } from "#src/remview/type/view.js"
import type { ReqState } from "#src/reqstate/type/state.js"
import * as sc from "@qyu/signal-core"

type Joins_Props<RDef extends RemNode_Def, Joins extends Join_NewRemNode_Joins_G<RDef>> = {
    [K in keyof Joins]: sc.OSignal<Join_Option<
        sc.Signal_InferO<ReturnType<ReturnType<Joins[K]>["prop"]>>
    >>
}

export type Join_NewRemNode_Joins_G<RDef extends RemNode_Def> = {
    readonly [K in string]: () => Join<RemView<RDef>, any>
}

export type Join_NewRemNode_Joins<RDef extends RemNode_Def, Joins extends Join_NewRemNode_Joins_G<RDef>> = {
    [K in keyof Joins]: Join_Option_InferValue<sc.Signal_InferO<ReturnType<ReturnType<Joins[K]>["prop"]>>>
}

export type Join_NewRemNode_Params<
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
> = {
    readonly joins: Joins
    readonly link_new: (param: Param) => RemNode<RDef>
}

export const join_new_remnode = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
>(
    params: Join_NewRemNode_Params<Param, RDef, Joins>
): Join<Param, Join_RemNode<RDef, Join_NewRemNode_Joins<RDef, Joins>>> {
    return {
        root: param => {
            const link = params.link_new(param)

            const view_s = remview_new_node(link)

            const dataprop_s = sc.osignal_new_pipe(
                view_s,
                view => {
                    return {
                        kind: Join_Option_Kind.View,

                        value: view,
                    }
                }
            )

            const joins_props: Partial<Joins_Props<RDef, Joins>> = {}

            for (const key of Object.keys(params.joins) as (keyof Joins)[]) {
                const join = params.joins[key]!()

                joins_props[key] = sc.osignal_new_memo(join.prop(dataprop_s), null)
            }

            const joins_rawprops_s = sc.osignal_new_mergemap(joins_props as Joins_Props<RDef, Joins>)

            const joins_s = sc.osignal_new_pipe(joins_rawprops_s, (joins_rawprops): Join_Option<Join_NewRemNode_Joins<RDef, Joins>> => {
                const joins: Partial<Join_NewRemNode_Joins<RDef, Joins>> = {}

                for (const key of Object.keys(joins_rawprops) as (keyof typeof joins_rawprops)[]) {
                    const join_rawprop = joins_rawprops[key]!

                    switch (join_rawprop.kind) {
                        case Join_Option_Kind.None:
                            return {
                                kind: Join_Option_Kind.None,
                            }
                        case Join_Option_Kind.View: {
                            joins[key] = join_rawprop.value as (
                                Join_Option_InferValue<
                                    sc.Signal_InferO<
                                        ReturnType<ReturnType<Joins[typeof key]>["prop"]>
                                    >
                                >
                            )

                            break
                        }
                    }
                }

                return {
                    kind: Join_Option_Kind.View,
                    value: joins as Join_NewRemNode_Joins<RDef, Joins>,
                }
            })

            return {
                kind: Join_Option_Kind.View,

                value: sc.osignal_new_pipe(
                    sc.osignal_new_merge([
                        sc.osignal_new_memo(dataprop_s, null),
                        joins_s
                    ] as const),
                    ([data, joins]) => {
                        if (data.kind === Join_Option_Kind.None || joins.kind === Join_Option_Kind.None) {
                            return {
                                kind: Join_Option_Kind.None,
                            }
                        }

                        return {
                            kind: Join_Option_Kind.View,

                            value: {
                                meta: data.value.meta,

                                data: data.value.data && {
                                    joins: joins.value,
                                    core: data.value.data,
                                },
                            },
                        }
                    }
                )
            }
        },

        prop: param_s => {
            const link_s = sc.osignal_new_pipe(param_s, (param): Join_Option<RemNode<RDef>> => {
                switch (param.kind) {
                    case Join_Option_Kind.None:
                        return {
                            kind: Join_Option_Kind.None
                        }
                    case Join_Option_Kind.View:
                        return {
                            kind: Join_Option_Kind.View,
                            value: params.link_new(param.value)
                        }
                }
            })

            const meta_s = sc.osignal_new_pipe(link_s, (link): Join_Option<RemNode_Meta<RDef>> => {
                switch (link.kind) {
                    case Join_Option_Kind.None:
                        return {
                            kind: Join_Option_Kind.None
                        }
                    case Join_Option_Kind.View:
                        return {
                            kind: Join_Option_Kind.View,
                            value: link.value.meta
                        }
                }
            })

            const statics_s = sc.osignal_new_pipe(link_s, (link): Join_Option<RDef["statics"]> => {
                switch (link.kind) {
                    case Join_Option_Kind.None:
                        return {
                            kind: Join_Option_Kind.None
                        }
                    case Join_Option_Kind.View:
                        return {
                            kind: Join_Option_Kind.View,
                            value: link.value.statics
                        }
                }
            })

            const real_s = sc.osignal_new_pipeflat_pick(
                link_s,
                link => {
                    switch (link.kind) {
                        case Join_Option_Kind.None:
                            return {
                                pick: false,
                                value: {
                                    kind: Join_Option_Kind.None
                                } satisfies Join_Option<ReqState<RDef["data"], RDef["request_meta"], RDef["request_result"]>>
                            }
                        case Join_Option_Kind.View:
                            return {
                                pick: true,
                                value: sc.osignal_new_pipe(link.value.real, real => {
                                    return {
                                        kind: Join_Option_Kind.View,
                                        value: real,
                                    } satisfies Join_Option<ReqState<RDef["data"], RDef["request_meta"], RDef["request_result"]>>
                                })
                            }
                    }
                }
            )

            const optimistic_s = sc.osignal_new_pipeflat_pick(
                sc.osignal_new_pipeflat_pick(
                    link_s,
                    link => {
                        switch (link.kind) {
                            case Join_Option_Kind.None:
                                return {
                                    pick: false,
                                    value: {
                                        kind: Join_Option_Kind.None
                                    } satisfies Join_Option<[unknown, RemOpt<RDef["data"]>][]>
                                }
                            case Join_Option_Kind.View:
                                return {
                                    pick: true,

                                    value: sc.osignal_new_pipe(link.value.optimistic.entries_signal(), entries => {
                                        return {
                                            kind: Join_Option_Kind.View,
                                            value: entries,
                                        } satisfies Join_Option<[unknown, RemOpt<RDef["data"]>][]>
                                    })
                                }
                        }
                    }
                ),
                entries => {
                    switch (entries.kind) {
                        case Join_Option_Kind.None:
                            return {
                                pick: false,
                                value: {
                                    kind: Join_Option_Kind.None
                                } satisfies Join_Option<(RemOpt_State<RDef["data"]> | null)[]>
                            }
                        case Join_Option_Kind.View:
                            return {
                                pick: true,

                                value: sc.osignal_new_pipe(
                                    sc.osignal_new_merge(entries.value.map(entry => entry[1])),
                                    values => {
                                        return {
                                            kind: Join_Option_Kind.View,
                                            value: values
                                        } satisfies Join_Option<(RemOpt_State<RDef["data"]> | null)[]>
                                    }
                                )
                            }
                    }
                }
            )

            const data_s = sc.osignal_new_pipe(
                sc.osignal_new_merge([real_s, optimistic_s, statics_s, meta_s] as const),
                ([real, optimistic, statics, meta]): Join_Option<RemView<RDef>> => {
                    if (
                        real.kind === Join_Option_Kind.None
                        || optimistic.kind === Join_Option_Kind.None
                        || statics.kind === Join_Option_Kind.None
                        || meta.kind === Join_Option_Kind.None
                    ) {
                        return {
                            kind: Join_Option_Kind.None,
                        }
                    }

                    return {
                        kind: Join_Option_Kind.View,

                        value: remview_new_raw({
                            meta: meta.value,
                            real: real.value,
                            statics: statics.value,
                            optimistic: optimistic.value,
                        })
                    }
                }
            )

            const joins_props: Partial<Joins_Props<RDef, Joins>> = {}

            for (const key of Object.keys(params.joins) as (keyof Joins)[]) {
                const join = params.joins[key]!()

                joins_props[key] = sc.osignal_new_memo(join.prop(data_s), null)
            }

            const joins_rawprops_s = sc.osignal_new_mergemap(joins_props as Joins_Props<RDef, Joins>)

            const joins_s = sc.osignal_new_pipe(joins_rawprops_s, (joins_rawprops): Join_Option<Join_NewRemNode_Joins<RDef, Joins>> => {
                const joins: Partial<Join_NewRemNode_Joins<RDef, Joins>> = {}

                for (const key of Object.keys(joins_rawprops) as (keyof typeof joins)[]) {
                    const join = joins_rawprops[key]!

                    switch (join.kind) {
                        case Join_Option_Kind.None:
                            return {
                                kind: Join_Option_Kind.None,
                            }
                        case Join_Option_Kind.View: {
                            joins[key] = join.value as (
                                Join_Option_InferValue<
                                    sc.Signal_InferO<
                                        ReturnType<ReturnType<Joins[typeof key]>["prop"]>
                                    >
                                >
                            )

                            break
                        }
                    }
                }

                return {
                    kind: Join_Option_Kind.View,
                    value: joins as Join_NewRemNode_Joins<RDef, Joins>,
                }
            })

            return sc.osignal_new_pipe(
                sc.osignal_new_merge([
                    sc.osignal_new_memo(data_s, null),
                    joins_s
                ] as const),
                ([data, joins]) => {
                    if (data.kind === Join_Option_Kind.None || joins.kind === Join_Option_Kind.None) {
                        return {
                            kind: Join_Option_Kind.None,
                        }
                    }

                    return {
                        kind: Join_Option_Kind.View,

                        value: {
                            meta: data.value.meta,
                            data: data.value.data && {
                                core: data.value.data,
                                joins: joins.value,
                            }
                        },
                    }
                }
            )
        },
    }
}

export const join_newf_remnode = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
>(
    params: Join_NewRemNode_Params<Param, RDef, Joins>
): JoinF<Param, Join_RemNode<RDef, Join_NewRemNode_Joins<RDef, Joins>>> {
    const result = join_new_remnode(params)

    return () => result
}

export const join_news_remnode = function <
    Param,
    RDef extends RemNode_Def,
    Joins extends Join_NewRemNode_Joins_G<RDef>
>(
    link_new: (param: Param) => RemNode<RDef>,
    joins: Joins
): JoinF<Param, Join_RemNode<RDef, Join_NewRemNode_Joins<RDef, Joins>>> {
    const result = join_new_remnode({
        link_new,
        joins,
    })

    return () => result
}
