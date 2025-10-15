import type { AtomFamily, AtomFamily_EntryChangeEvent } from "#src/atom/family/type/AtomFamily.js"
import type { Indexer } from "#src/indexer/type/indexer.js"
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js"
import * as sc from "@qyu/signal-core"

export type Indexer_ConnectFamily_Params<V> = Readonly<{
    indexer: Indexer<V, V, any>
    source: AtomFamily<any, V>
}>

export const indexer_connect_family = function <V>(params: Indexer_ConnectFamily_Params<V>): AtomSelectorStatic<VoidFunction> {
    return ({ reg }) => {
        const family = reg(params.source)

        const listener = function(ev: AtomFamily_EntryChangeEvent<V>) {
            switch (ev.type) {
                case "post": {
                    params.indexer.ref_add(ev.value_next, ev.value_next)

                    break
                }
                case "delete": {
                    params.indexer.ref_delete(ev.value_prev)

                    break
                }
                case "patch": {
                    sc.batcher.batch_sync(() => {
                        params.indexer.ref_delete(ev.value_prev)
                        params.indexer.ref_add(ev.value_next, ev.value_next)
                    })

                    break
                }
            }
        }

        family.entries_signal().output().forEach(([, ref]) => {
            params.indexer.ref_add(ref, ref)
        })

        family.entries_event_change_addsub(listener)

        return () => {
            family.entries_event_change_rmsub(listener)
        }
    }
}
