import type { AtomFamily, AtomFamily_EntryChangeEvent } from "#src/family/type/AtomFamily.js"
import type { Indexer } from "#src/indexer/type/indexer.js"
import type { AtomRemNode_Def, AtomRemNode_Value } from "#src/remnode/type/State.js"
import { remnode_data } from "#src/remnode/util/data.js"
import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js"
import { ReqState__Status } from "#src/reqstate/type/State.js"
import * as sc from "@qyu/signal-core"

type Dep = {
    esignal: sc.ESignal
    sub: VoidFunction
}

export type Indexer_ConnectRemNode_Data<Def extends AtomRemNode_Def> = Readonly<{
    statics: Def["statics"]
    data: Def["data"] | null
    pending_meta: Def["request_meta"] | null
}>

export type Indexer_ConnectRemNode_Params<Def extends AtomRemNode_Def> = Readonly<{
    indexer: Indexer<AtomRemNode_Value<Def>, Indexer_ConnectRemNode_Data<Def>, any>
    source: AtomFamily<any, AtomRemNode_Value<Def>>

    real_clone?: (data: Def["data"]) => Def["data"]
}>

export const indexer_connect_remnode = function <Def extends AtomRemNode_Def>(
    params: Indexer_ConnectRemNode_Params<Def>
): AtomSelectorStatic<VoidFunction> {
    return ({ reg }) => {
        const family = reg(params.source)
        const map_deps = new Map<AtomRemNode_Value<Def>, Dep>()

        const ev_post = function(value: AtomRemNode_Value<Def>) {
            const real = value.real
            const optimistic = sc.osignal_new_flat(sc.osignal_new_pipe(
                value.optimistic.entries_signal(),
                entries => sc.osignal_new_merge(
                    entries.map(entry => entry[1])
                )
            ))

            {
                const data = remnode_data({
                    real: real.output(),
                    statics: value.statics,
                    optimistic: optimistic.output(),

                    real_clone: params.real_clone,
                })

                params.indexer.ref_add(value, {
                    data: data.data,
                    statics: data.meta.statics,
                    pending_meta: data.status === ReqState__Status.Pending ? data.meta.request : null,
                })
            }

            {
                const esignal = sc.esignal_new_merge([real, optimistic])

                const sub = () => {
                    const data = remnode_data({
                        real: real.output(),
                        statics: value.statics,
                        optimistic: optimistic.output(),

                        real_clone: params.real_clone,
                    })

                    params.indexer.ref_update(value, {
                        data: data.data,
                        statics: data.meta.statics,
                        pending_meta: data.status === ReqState__Status.Pending ? data.meta.request : null,
                    })
                }

                map_deps.set(value, {
                    esignal,
                    sub
                })

                esignal.addsub(sub)
            }
        }

        const ev_delete = function(value: AtomRemNode_Value<Def>) {
            params.indexer.ref_delete(value)

            const dep = map_deps.get(value)!

            dep.esignal.rmsub(dep.sub)

            map_deps.delete(value)
        }

        const listener = function(ev: AtomFamily_EntryChangeEvent<AtomRemNode_Value<Def>>) {
            switch (ev.type) {
                case "post": {
                    ev_post(ev.value_next)

                    break
                }
                case "delete": {
                    ev_delete(ev.value_prev)

                    break
                }
                case "patch": {
                    sc.batcher.batch_sync(() => {
                        ev_delete(ev.value_prev)
                        ev_post(ev.value_next)
                    })

                    break
                }
            }
        }

        sc.batcher.batch_sync(() => {
            family.entries_signal().output().forEach(([, ref]) => {
                ev_post(ref)
            })
        })

        family.entries_event_change_addsub(listener)

        return () => {
            family.entries_event_change_rmsub(listener)

            map_deps.forEach(dep => {
                dep.esignal.rmsub(dep.sub)
            })
        }
    }
}
