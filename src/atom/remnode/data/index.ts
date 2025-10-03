import type { AtomRemNode__Data } from "#src/atom/remnode/type/Data.js";
import type { AtomRemNode, AtomRemNode_Def, AtomRemNode_OptimisticValue } from "#src/atom/remnode/type/State.js";
import type { AtomRemReq_State } from "#src/atom/remreq/type/State.js";
import type { AtomSelectorDynamic } from "#src/atom/selector/type/AtomSelector.js";
import { ReqState__Status } from "#src/reqstate/type/State.js";
import * as sc from "@qyu/signal-core";

const clone = function <Data extends {}>(source: Data, cloner?: (data: Data) => Data): Data {
    if (cloner) {
        return cloner(source)

    }

    return structuredClone(source)
}

type Optimistic_Params<Data extends {}> = Readonly<{
    source: Data
    updates: (AtomRemReq_State<AtomRemNode_OptimisticValue<Data>> | null)[]

    real_clone?: (data: Data) => Data
}>

const optimistic = function <Data extends {}>(params: Optimistic_Params<Data>): Data {
    let cpy: Data = clone(params.source)

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

export type AtomRemNode_Data_Params<Def extends AtomRemNode_Def> = {
    readonly remnode: AtomRemNode<Def>

    readonly real_clone?: (data: Def["data"]) => Def["data"]
}

export const atomremnode_data = function <Def extends AtomRemNode_Def>(
    params: AtomRemNode_Data_Params<Def>
): AtomSelectorDynamic<AtomRemNode__Data<Def>> {
    return ({ reg }) => {
        const remnode = reg(params.remnode)
        const real = reg(remnode.real)
        const optimistic_family = reg(remnode.optimistic)
        const optimistic_entries = optimistic_family.entries_signal()

        return sc.osignal_new_pipe(
            sc.osignal_new_merge([
                real,
                sc.osignal_new_flat(sc.osignal_new_pipe(
                    optimistic_entries,
                    entries => sc.osignal_new_merge(
                        entries.map(entry => entry[1])
                    )
                ))
            ] as const),
            ([real_o, optimistic_o]) => {
                switch (real_o.status) {
                    case ReqState__Status.Empty: {
                        return {
                            status: ReqState__Status.Empty,

                            data: null,

                            meta: {
                                source: "direct",
                            }
                        }
                    }
                    case ReqState__Status.Pending: {
                        if (real_o.optimistic) {
                            return {
                                status: ReqState__Status.Pending,

                                data: optimistic({
                                    updates: optimistic_o,
                                    source: real_o.optimistic,
                                    real_clone: params.real_clone,
                                }),

                                meta: {
                                    source: "optimistic",
                                },
                            }
                        }

                        if (real_o.fallback) {
                            return {
                                status: ReqState__Status.Pending,

                                data: optimistic({
                                    updates: optimistic_o,
                                    source: real_o.fallback,
                                    real_clone: params.real_clone,
                                }),

                                meta: {
                                    source: "fallback",
                                },
                            }
                        }

                        return {
                            status: ReqState__Status.Pending,

                            data: null,

                            meta: {
                                source: "direct"
                            },
                        }
                    }
                    case ReqState__Status.Fulfilled: {
                        return {
                            status: ReqState__Status.Fulfilled,

                            data: optimistic({
                                updates: optimistic_o,
                                source: real_o.data,
                                real_clone: params.real_clone,
                            }),

                            meta: {
                                source: "direct"
                            },
                        }
                    }
                }
            }
        )
    }
}
