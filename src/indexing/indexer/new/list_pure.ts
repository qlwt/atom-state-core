import type { Indexer, IndexerF } from "#src/indexing/type/indexer.js";
import { Indexer_EventKind } from "#src/indexing/type/indexer.js";
import * as sc from "@qyu/signal-core";

export const indexer_new_list_pure = function <Ref>(): Indexer<Ref, void, void> {
    const state = sc.signal_new_value(new Set<Ref>())

    return {
        input: evs => {
            const state_o = state.output()

            for (let i = 0; i < evs.length; ++i) {
                const ev = evs[i]!

                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        state_o.delete(ev[1])

                        break
                    }
                    case Indexer_EventKind.Add: {
                        state_o.add(ev[1])

                        break
                    }
                }
            }

            state.input(state_o)
        },

        input_add: ref => {
            const state_o = state.output()

            state_o.add(ref)
            state.input(state_o)
        },

        input_delete: ref => {
            const state_o = state.output()

            state_o.delete(ref)
            state.input(state_o)
        },

        input_update: () => {
        },

        filter: () => {
            return sc.osignal_new_pipe(state, state_o => {
                return {
                    order: null,

                    [Symbol.iterator]: state_o[Symbol.iterator].bind(state_o),

                    ref_has: ref => {
                        return state_o.has(ref)
                    }
                }
            })
        },
    }
}

export const indexer_newf_list_pure = function <Ref>(): IndexerF<Ref, void, void> {
    return () => indexer_new_list_pure()
}
