import type { AtomRemNode__Data } from "#src/atom/remnode/type/Data.js";
import type { AtomRemNode_Def, AtomRemNode_OptimisticValue } from "#src/atom/remnode/type/State.js";
import type { AtomRemReq_State } from "#src/atom/remreq/type/State.js";
import { ReqState__Status, type ReqState } from "#src/reqstate/type/State.js";

const clone = function <Data extends {}>(source: Data, cloner?: (data: Data) => Data): Data {
    if (cloner) {
        return cloner(source)
    }

    return structuredClone(source)
}

type Optimistic__Apply_Params<Data extends {}> = Readonly<{
    source: Data
    updates: (AtomRemReq_State<AtomRemNode_OptimisticValue<Data>> | null)[]

    real_clone?: (data: Data) => Data
}>

const optimistic_apply = function <Data extends {}>(params: Optimistic__Apply_Params<Data>): Data {
    let cpy: Data = clone(params.source, params.real_clone)

    for (const update of params.updates) {
        if (!update) {
            continue
        }

        switch (typeof update.data) {
            case "object": {
                for (const key of Object.keys(update.data)) {
                    const key_value = update.data[key as keyof Data]

                    if (key_value !== undefined) {
                        cpy[key as keyof Data] = key_value
                    }
                }

                break
            }
            case "function": {
                const result = update.data(cpy)

                if (result !== undefined) {
                    cpy = result
                }

                break
            }
        }

    }

    return cpy
}

export type RemNode__Data_Params<Def extends AtomRemNode_Def> = Readonly<{
    statics: Def["statics"]
    real: ReqState<Def["data"], Def["request_meta"], Def["request_result"]>,
    optimistic: (AtomRemReq_State<AtomRemNode_OptimisticValue<Def["data"]>> | null)[]

    real_clone?: (data: Def["data"]) => Def["data"]
}>

export const remnode_data = function <Def extends AtomRemNode_Def>(params: RemNode__Data_Params<Def>): AtomRemNode__Data<Def> {
    const { real, optimistic } = params

    switch (real.status) {
        case ReqState__Status.Empty: {
            return {
                status: ReqState__Status.Empty,

                data: null,

                meta: {
                    source: "direct",
                    statics: params.statics,
                }
            }
        }
        case ReqState__Status.Pending: {
            if (real.optimistic) {
                return {
                    status: ReqState__Status.Pending,

                    data: optimistic_apply({
                        updates: optimistic,
                        source: real.optimistic,
                        real_clone: params.real_clone,
                    }),

                    meta: {
                        source: "optimistic",
                        request: real.meta,
                        statics: params.statics,
                    },
                }
            }

            if (real.fallback) {
                return {
                    status: ReqState__Status.Pending,

                    data: optimistic_apply({
                        updates: optimistic,
                        source: real.fallback,
                        real_clone: params.real_clone,
                    }),

                    meta: {
                        source: "fallback",
                        request: real.meta,
                        statics: params.statics,
                    },
                }
            }

            return {
                status: ReqState__Status.Pending,

                data: null,

                meta: {
                    source: "direct",
                    request: real.meta,
                    statics: params.statics,
                },
            }
        }
        case ReqState__Status.Fulfilled: {
            return {
                status: ReqState__Status.Fulfilled,

                data: optimistic_apply({
                    updates: optimistic,
                    source: real.data,
                    real_clone: params.real_clone,
                }),

                meta: {
                    source: "direct",
                    statics: params.statics,
                },
            }
        }
    }
}
