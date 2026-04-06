import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js";
import { remview_new_raw } from "#src/remview/new/raw.js";
import type { RemView } from "#src/remview/type/view.js";
import * as sc from "@qyu/signal-core";

export const remview_new_node = function <Def extends RemNode_Def>(
    remnode: RemNode<Def>
): sc.OSignal<RemView<Def>> {
    const real = remnode.real
    const optimistic_family = remnode.optimistic
    const optimistic_entries = optimistic_family.entries_signal()

    return sc.osignal_new_pipe(
        sc.osignal_new_merge([
            real,
            sc.osignal_new_memo(
                sc.osignal_new_pipeflat(
                    optimistic_entries,
                    entries => sc.osignal_new_merge(
                        entries.map(entry => entry[1])
                    )
                ),
                null
            )
        ] as const),
        ([real_o, optimistic_o]) => {
            return remview_new_raw({
                real: real_o,
                meta: remnode.meta,
                optimistic: optimistic_o,
                statics: remnode.statics,
            })
        }
    )
}
