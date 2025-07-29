import type { AtomRemNode__Data } from "#src/atom/remnode/type/Data.js";
import type { AtomRemNode, AtomRemNode_Def } from "#src/atom/remnode/type/State.js";
import type { AtomRemReq_State } from "#src/atom/remreq/type/State.js";
import type { AtomSelectorDynamic } from "#src/atom/selector/type/AtomSelector.js";
import { ReqState__Status } from "#src/reqstate/type/State.js";
import * as sc from "@qyu/signal-core";

const optimistic = function <Data extends {}>(source: Data, updates: (AtomRemReq_State<Partial<Data>> | null)[]): Data {
    const cpy = { ...source }

    for (const update of updates) {
        if (!update) {
            continue
        }

        for (const key of Object.keys(update.data)) {
            const value = update.data[key as keyof Data]

            if (value !== undefined) {
                cpy[key as keyof Data] = value
            }
        }
    }

    return cpy
}

export type AtomRemNode_Data_Params<Def extends AtomRemNode_Def> = {
    readonly remnode: AtomRemNode<Def>
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

                                data: optimistic(real_o.optimistic, optimistic_o),

                                meta: {
                                    source: "optimistic",
                                },
                            }
                        }

                        if (real_o.fallback) {
                            return {
                                status: ReqState__Status.Pending,

                                data: optimistic(real_o.fallback, optimistic_o),

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

                            data: optimistic(real_o.data, optimistic_o),

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
