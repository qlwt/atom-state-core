import type { Family, Family_EntryChangeEvent } from "#src/family/type/family.js"
import { idxbatcher_new_basic } from "#src/indexing/batcher/new/basic.js"
import type { IdxInput } from "#src/indexing/type/indexer.js"
import type { RemNode, RemNode_Def } from "#src/remnode/type/def.js"
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"
import * as sc from "@qyu/signal-core"

type Dep = {
    esignal: sc.ESignal
    sub: VoidFunction
}

export type Indexer_ConnectFamilyRemNode_Params<Def extends RemNode_Def, View> = {
    readonly callbatcher: CallBatcher
    readonly src: Family<any, RemNode<Def>>
    readonly indexer: IdxInput<RemNode<Def>, View>
    readonly view_new: (def: RemNode<Def>) => sc.OSignal<View> | null
}

export const indexer_connect_family_remnode = function <Def extends RemNode_Def, View>(
    params: Indexer_ConnectFamilyRemNode_Params<Def, View>
): VoidFunction {
    const family = params.src
    const map_deps = new Map<RemNode<Def>, Dep>()

    const idxbatcher = idxbatcher_new_basic({
        indexer: params.indexer,
        callbatcher: params.callbatcher,
    })

    const ev_post = function(ref: RemNode<Def>): boolean {
        const view_s = params.view_new(ref)

        if (view_s) {
            const shouldemit = idxbatcher.reg_add(ref, view_s.output())

            {
                const esignal = view_s

                const sub = () => {
                    if (idxbatcher.reg_update(ref, view_s.output())) {
                        idxbatcher.emit()
                    }
                }

                map_deps.set(ref, {
                    esignal,
                    sub
                })

                esignal.addsub(sub, { order: 1 })
            }

            return shouldemit
        }

        return false
    }

    const ev_delete = function(ref: RemNode<Def>): boolean {
        const dep = map_deps.get(ref)!

        const shouldemit = idxbatcher.reg_delete(ref)

        dep.esignal.rmsub(dep.sub)
        map_deps.delete(ref)

        return shouldemit
    }

    const listener = function(ev: Family_EntryChangeEvent<unknown, RemNode<Def>>) {
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
                if (ev.value_prev !== ev.value_next) {
                    const changed_delete = ev_delete(ev.value_prev)
                    const changed_post = ev_delete(ev.value_next)

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

        family.entries_signal().output().forEach(([, ref]) => {
            const l_shouldemit = ev_post(ref)

            shouldemit = shouldemit || l_shouldemit
        })

        family.entries_event_change_addsub(listener)

        if (shouldemit) {
            idxbatcher.emit()
        }
    })


    return () => {
        family.entries_event_change_rmsub(listener)

        map_deps.forEach(dep => {
            dep.esignal.rmsub(dep.sub)
        })
    }
}
