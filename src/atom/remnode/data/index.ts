import type { AtomRemNode__Data } from "#src/atom/remnode/type/Data.js";
import type { AtomRemNode, AtomRemNode_Def } from "#src/atom/remnode/type/State.js";
import { remnode_data } from "#src/atom/remnode/util/data.js";
import type { AtomSelectorDynamic } from "#src/atom/selector/type/AtomSelector.js";
import * as sc from "@qyu/signal-core";

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
                return remnode_data({
                    real: real_o,
                    optimistic: optimistic_o,
                    real_clone: params.real_clone
                })
            }
        )
    }
}
