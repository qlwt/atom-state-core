import type { RemNode_Cloner, RemNode_Def, RemNode_Meta } from "#src/remnode/type/def.js"
import type { RemOpt_Patch, RemOpt_State } from "#src/remopt/type/remopt.js"
import type { RemView, RemView_PendingOptimistic } from "#src/remview/type/view.js"
import { ReqState_Status, type ReqState } from "#src/reqstate/type/state.js"

const optimistic_apply = function <Data extends {}>(
    cpy: Data, update: RemOpt_Patch<Data, unknown> | null
) {
    if (update) {
        update.applicator(cpy, update?.data)
    }
}

type Optimistic__Apply_Params<Data extends {}> = {
    readonly source: Data
    readonly cloner: RemNode_Cloner<Data>
    readonly updates: readonly (RemOpt_State<Data> | null)[]
}

const optimistics_apply = function <Data extends {}>(params: Optimistic__Apply_Params<Data>): Data {
    return params.cloner(params.source, cpy => {
        for (const update of params.updates) {
            if (!update) {
                continue
            }

            const acts = update.request_active
            const sch = update.request_scheduled

            for (const act of acts) {
                optimistic_apply(cpy, act?.patch ?? null)
            }

            optimistic_apply(cpy, sch?.patch ?? null)
        }
    })
}

export type RemView_NewRaw_Params<Def extends RemNode_Def> = {
    readonly meta: RemNode_Meta<Def>
    readonly statics: Def["statics"]
    readonly optimistic: readonly (RemOpt_State<Def["data"]> | null)[]
    readonly real: ReqState<Def["data"], Def["request_meta"], Def["request_result"]>
}

export const remview_new_raw = function <Def extends RemNode_Def>(
    params: RemView_NewRaw_Params<Def>,
): RemView<Def> {
    switch (params.real.status) {
        case ReqState_Status.Empty: {
            return {
                status: ReqState_Status.Empty,

                data: null,

                meta: {
                    error: params.real.error,
                    source: "direct",
                    statics: params.statics,
                }
            }
        }
        case ReqState_Status.Pending: {
            if (params.real.optimistic) {
                return {
                    status: ReqState_Status.Pending,

                    data: optimistics_apply({
                        cloner: params.meta.cloner,
                        updates: params.optimistic,
                        source: params.real.optimistic.value,
                    }),

                    meta: {
                        source: "optimistic",
                        statics: params.statics,
                        request: params.real.meta,
                    },
                } satisfies RemView_PendingOptimistic<Def>
            }

            if (params.real.fallback && params.real.fallback.status_view) {
                return {
                    status: ReqState_Status.Pending,

                    data: optimistics_apply({
                        cloner: params.meta.cloner,
                        updates: params.optimistic,
                        source: params.real.fallback.value,
                    }),

                    meta: {
                        source: "fallback",
                        statics: params.statics,
                        request: params.real.meta,
                    },
                }
            }

            return {
                status: ReqState_Status.Pending,

                data: null,

                meta: {
                    source: "direct",
                    statics: params.statics,
                    request: params.real.meta,
                },
            }
        }
        case ReqState_Status.Fulfilled: {
            return {
                status: ReqState_Status.Fulfilled,

                data: optimistics_apply({
                    cloner: params.meta.cloner,
                    source: params.real.data,
                    updates: params.optimistic,
                }),

                meta: {
                    source: "direct",
                    statics: params.statics,
                },
            }
        }
    }
}
