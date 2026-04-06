import type { Family, Family_EntryChangeEvent } from "#src/family/type/family.js"
import { idxbatcher_new_basic } from "#src/indexing/batcher/new/basic.js"
import type { IdxInput } from "#src/indexing/type/indexer.js"
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"
import * as sc from "@qyu/signal-core"

type Dep = {
    esignal: sc.ESignal
    sub: VoidFunction
}

export type Indexer_ConnectFamilyDynamic_Params<V extends sc.OSignal> = {
    readonly src: Family<any, V>
    readonly callbatcher: CallBatcher
    readonly indexer: IdxInput<V, sc.Signal_InferO<V>>
}

export const indexer_connect_family_dynamic = function <V extends sc.OSignal>(
    params: Indexer_ConnectFamilyDynamic_Params<V>
): VoidFunction {
    const map_deps = new Map<V, Dep>()

    const idxbatcher = idxbatcher_new_basic({
        indexer: params.indexer,
        callbatcher: params.callbatcher,
    })

    const ev_post = function(ref: V): boolean {
        const shouldemit = idxbatcher.reg_add(ref, ref.output())

        {
            const esignal = ref

            const sub = () => {
                idxbatcher.reg_update(ref, ref.output())

                idxbatcher.emit()
            }

            map_deps.set(ref, {
                esignal,
                sub
            })

            esignal.addsub(sub, { order: 1 })
        }

        return shouldemit
    }

    const ev_delete = function(ref: V): boolean {
        const dep = map_deps.get(ref)!

        const shouldemit = idxbatcher.reg_delete(ref)

        dep.esignal.rmsub(dep.sub)
        map_deps.delete(ref)

        return shouldemit
    }

    const listener = function(ev: Family_EntryChangeEvent<unknown, V>) {
        switch (ev.type) {
            case "post": {
                const changed_post = ev_post(ev.value_next)

                if (changed_post) {
                    idxbatcher.emit()
                }

                break
            }
            case "delete": {
                const changed_delete = ev_delete(ev.value_prev)

                if (changed_delete) {
                    idxbatcher.emit()
                }

                break
            }
            case "patch": {
                if (ev.value_prev === ev.value_next) {
                    // nothing really changed, just schedule an update
                    const changed_update = idxbatcher.reg_update(ev.value_next, ev.value_next.output())

                    if (changed_update) {
                        idxbatcher.emit()
                    }
                } else {
                    const changed_delete = ev_delete(ev.value_prev)
                    const changed_post = ev_post(ev.value_next)

                    if (changed_delete || changed_post) {
                        idxbatcher.emit()
                    }
                }

                break
            }
        }
    }

    sc.batcher.batch_sync(() => {
        let shouldemit = false

        params.src.entries_signal().output().forEach(([, ref]) => {
            const l_shouldemit = ev_post(ref)

            shouldemit = shouldemit || l_shouldemit
        })

        params.src.entries_event_change_addsub(listener)

        if (shouldemit) {
            idxbatcher.emit()
        }
    })

    return () => {
        params.src.entries_event_change_rmsub(listener)

        map_deps.forEach(dep => {
            dep.esignal.rmsub(dep.sub)
        })
    }
}
