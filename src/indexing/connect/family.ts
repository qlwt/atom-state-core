import type { Family, Family_EntryChangeEvent } from "#src/family/type/family.js"
import { idxbatcher_new_pure } from "#src/indexing/batcher/new/pure.js"
import type { IdxInput } from "#src/indexing/type/indexer.js"
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"

export type Indexer_ConnectFamily_Params<V> = {
    readonly src: Family<any, V>
    readonly callbatcher: CallBatcher
    readonly indexer: IdxInput<V, V>
}

export const indexer_connect_family = function <V>(params: Indexer_ConnectFamily_Params<V>): VoidFunction {
    const idxbatcher = idxbatcher_new_pure({
        indexer: params.indexer,
        callbatcher: params.callbatcher,
    })

    const listener = function(ev: Family_EntryChangeEvent<unknown, V>) {
        switch (ev.type) {
            case "post": {
                const changed_add = idxbatcher.reg_add(ev.value_next)

                if (changed_add) {
                    idxbatcher.emit()
                }

                break
            }
            case "delete": {
                const changed_delete = idxbatcher.reg_delete(ev.value_prev)

                if (changed_delete) {
                    idxbatcher.emit()
                }

                break
            }
            case "patch": {
                if (ev.value_prev !== ev.value_next) {
                    const changed_delete = idxbatcher.reg_delete(ev.value_prev)
                    const changed_add = idxbatcher.reg_add(ev.value_next)

                    if (changed_delete || changed_add) {
                        idxbatcher.emit()
                    }
                }

                break
            }
        }
    }

    {
        let shouldemit = false

        params.src.entries_signal().output().forEach(([, ref]) => {
            shouldemit = idxbatcher.reg_add(ref) || shouldemit
        })

        params.src.entries_event_change_addsub(listener)

        if (shouldemit) {
            idxbatcher.emit()
        }
    }

    return () => {
        params.src.entries_event_change_rmsub(listener)
    }
}
