import { indexer_iev_new_add } from "#src/indexing/iev/new/add.js";
import { indexer_iev_new_delete } from "#src/indexing/iev/new/delete.js";
import { indexer_iev_new_update } from "#src/indexing/iev/new/update.js";
import { Indexer_EventKind, type IdxInput, type Indexer_InputEvent } from "#src/indexing/type/indexer.js";
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";
import * as sc from "@qyu/signal-core";

export type IdxBatcherBasic<Ref, Data> = {
    readonly emit: VoidFunction
    readonly reg_delete: (ref: Ref) => boolean
    readonly reg_add: (ref: Ref, data: Data) => boolean
    readonly reg_update: (ref: Ref, data: Data) => boolean
}

export type IdxBatcher_NewBasic_Params<Ref, Data> = {
    readonly callbatcher: CallBatcher
    readonly indexer: IdxInput<Ref, Data>
}

export const idxbatcher_new_basic = function <Ref, Data>(
    params: IdxBatcher_NewBasic_Params<Ref, Data>
): IdxBatcherBasic<Ref, Data> {
    // values given to the collector
    const map_saved = new Map<Ref, { readonly value: Data }>()
    // batched updates
    let map_actions = new Map<Ref, Indexer_InputEvent<Ref, Data, unknown>>()

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

                            map_saved.delete(ev[1])

                            break
                        }
                        case Indexer_EventKind.Add: {
                            params.indexer.input_add(ev[1], ev[2], ev[4])

                            map_saved.set(ev[1], { value: ev[4] })

                            break
                        }
                        case Indexer_EventKind.Update: {
                            params.indexer.input_update(ev[1], ev[2], ev[3], ev[4])

                            map_saved.set(ev[1], { value: ev[4] })

                            break
                        }
                    }
                })

                map_actions = new Map()
            })

            return
        }

        sc.batcher.batch_sync(() => {
            const indexer_evs = new Array<Indexer_InputEvent<Ref, Data, unknown>>()

            for (const ev of map_actions.values()) {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        indexer_evs.push(ev)

                        map_saved.delete(ev[1])

                        break
                    }
                    case Indexer_EventKind.Add: {
                        indexer_evs.push(ev)

                        map_saved.set(ev[1], { value: ev[4] })

                        break
                    }
                    case Indexer_EventKind.Update: {
                        indexer_evs.push(ev)

                        map_saved.set(ev[1], { value: ev[4] })

                        break
                    }
                }
            }

            map_actions = new Map()
            params.indexer.input(indexer_evs)
        })
    }

    const result: IdxBatcherBasic<Ref, Data> = {
        emit: () => {
            params.callbatcher.emit(emit_sync)
        },

        reg_add: (ref, ref_o) => {
            const ev_saved = map_actions.get(ref)

            if (!ev_saved) {
                map_actions.set(ref, indexer_iev_new_add(ref, ref_o))

                return true
            } else {
                switch (ev_saved[0]) {
                    case Indexer_EventKind.Delete: {
                        // means you delete a and then add b
                        // same as updating a -> b
                        if (ref_o === ev_saved[3]) {
                            // if in a -> b a === b, no action is needed
                            map_actions.delete(ref)

                            return false
                        } else {
                            map_actions.set(ref, indexer_iev_new_update(ref, ev_saved[3], ref_o))

                            return true
                        }

                        break
                    }
                    case Indexer_EventKind.Update: {
                        // means you update a -> b and then b -> c
                        // same as updating a -> c
                        if (ref_o === ev_saved[3]) {
                            // if in a -> c a === c, no action is needed
                            map_actions.delete(ref)

                            return false
                        } else {
                            map_actions.set(ref, indexer_iev_new_update(ref, ev_saved[3], ref_o))

                            return true
                        }

                        break
                    }
                    case Indexer_EventKind.Add: {
                        // you add a then update to a -> b
                        // same as adding b
                        map_actions.set(ref, indexer_iev_new_add(ref, ref_o))

                        return true
                    }
                }
            }
        },

        reg_delete: (ref) => {
            const ev_saved = map_actions.get(ref)

            if (!ev_saved) {
                const ref_optr = map_saved.get(ref)

                if (ref_optr) {
                    map_actions.set(ref, indexer_iev_new_delete(ref, ref_optr.value))

                    return true
                }

                return false
            } else {
                switch (ev_saved[0]) {
                    case Indexer_EventKind.Delete: {
                        // means you delete a and then delete a again
                        // do nothing, delete is already scheduled

                        return false
                    }
                    case Indexer_EventKind.Update: {
                        // means you update value from a -> b and then delete b
                        // same as deleting a
                        map_actions.set(ref, indexer_iev_new_delete(ref, ev_saved[3]))

                        return true
                    }
                    case Indexer_EventKind.Add: {
                        // means you add a and then delete a
                        // same as doing nothing
                        map_actions.delete(ref)

                        return false
                    }
                }
            }
        },

        reg_update: (ref, ref_o) => {
            const ev_saved = map_actions.get(ref)

            if (!ev_saved) {
                const ref_optr = map_saved.get(ref)

                if (ref_optr) {
                    map_actions.set(ref, indexer_iev_new_update(ref, ref_optr.value, ref_o))

                    return true
                } else {
                    map_actions.set(ref, indexer_iev_new_add(ref, ref_o))

                    return true
                }
            } else {
                switch (ev_saved[0]) {
                    case Indexer_EventKind.Delete: {
                        // means you delete a then add b
                        // same as updating a -> b
                        if (ref_o === ev_saved[3]) {
                            // if in a -> b a === b, no action is needed
                            map_actions.delete(ref)

                            return false
                        } else {
                            map_actions.set(ref, indexer_iev_new_update(ref, ev_saved[3], ref_o))

                            return true
                        }

                        break
                    }
                    case Indexer_EventKind.Update: {
                        // means you update a -> b and then b -> c
                        // same as updating a -> c
                        if (ref_o === ev_saved[3]) {
                            // if in a -> c a === c, no action is needed
                            map_actions.delete(ref)

                            return false
                        } else {
                            map_actions.set(ref, indexer_iev_new_update(ref, ev_saved[3], ref_o))

                            return true
                        }

                        break
                    }
                    case Indexer_EventKind.Add: {
                        // you add a then update to a -> b
                        // same as adding b
                        map_actions.set(ref, indexer_iev_new_add(ref, ref_o))

                        return true
                    }
                }
            }
        }
    }

    return result
}
