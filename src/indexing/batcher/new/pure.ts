import { indexer_iev_new_add } from "#src/indexing/iev/new/add.js";
import { indexer_iev_new_delete } from "#src/indexing/iev/new/delete.js";
import { Indexer_EventKind, type IdxInput, type Indexer_InputEvent } from "#src/indexing/type/indexer.js";
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";
import * as sc from "@qyu/signal-core";

export type IdxBatcherPure<Ref> = {
    readonly emit: VoidFunction
    readonly reg_add: (ref: Ref) => boolean
    readonly reg_delete: (ref: Ref) => boolean
}

export type IdxBatcher_NewPure_Params<Ref> = {
    readonly callbatcher: CallBatcher
    readonly indexer: IdxInput<Ref, Ref>
}

export const idxbatcher_new_pure = function <Ref>(params: IdxBatcher_NewPure_Params<Ref>): IdxBatcherPure<Ref> {
    // batched updates
    let map_actions = new Map<Ref, Indexer_InputEvent<Ref, Ref, unknown>>()

    const emit_sync = () => {
        if (map_actions.size === 0) {
            return
        }

        if (map_actions.size === 1) {
            sc.batcher.batch_sync(() => {
                map_actions.forEach(ev => {
                    switch (ev[0]) {
                        case Indexer_EventKind.Delete: {
                            params.indexer.input_delete(ev[1], ev[2], ev[3])

                            break
                        }
                        case Indexer_EventKind.Add: {
                            params.indexer.input_add(ev[1], ev[2], ev[4])

                            break
                        }
                    }
                })

                map_actions = new Map()
            })

            return
        }

        sc.batcher.batch_sync(() => {
            const indexer_evs = new Array<Indexer_InputEvent<Ref, Ref, any>>()

            for (const ev of map_actions.values()) {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        indexer_evs.push(ev)

                        break
                    }
                    case Indexer_EventKind.Add: {
                        indexer_evs.push(ev)

                        break
                    }
                }
            }

            params.indexer.input(indexer_evs)

            map_actions = new Map()
        })
    }

    const result: IdxBatcherPure<Ref> = {
        emit: () => {
            params.callbatcher.emit(emit_sync)
        },

        reg_delete: (ref: Ref): boolean => {
            const ev_saved = map_actions.get(ref)

            if (!ev_saved) {
                // no update or element is already present - delete the element
                map_actions.set(ref, indexer_iev_new_delete(ref, ref))

                return true
            } else {
                switch (ev_saved[0]) {
                    case Indexer_EventKind.Delete: {
                        // delete a then delete a
                        // no action is needed

                        return false
                    }
                    case Indexer_EventKind.Add: {
                        // add a and then delete a
                        // clear the action

                        map_actions.delete(ref)

                        return false
                    }
                }
            }

            return false
        },

        reg_add: (ref: Ref): boolean => {
            const update_saved = map_actions.get(ref)

            if (!update_saved) {
                map_actions.set(ref, indexer_iev_new_add(ref, ref))

                return true
            } else {
                switch (update_saved[0]) {
                    case Indexer_EventKind.Delete: {
                        // delete a and then add a
                        // no action needed
                        map_actions.delete(ref)

                        return false
                    }
                    case Indexer_EventKind.Add: {
                        // add a and then add a
                        // no acion is needed

                        return true
                    }
                }
            }

            return false
        }
    }

    return result
}
