import type { AtomAction } from "#src/atom/action/type/AtomAction.js"
import * as sc from "@qyu/signal-core"
import type { AtomRemNode, AtomRemNode_Def, AtomRemNode_OptimisticValue } from "#src/atom/remnode/type/State.js"
import { ReqState__Status } from "#src/reqstate/type/State.js"

export type AtomRemNode_Action_Patch_Set_InterpretApi<Def extends AtomRemNode_Def, PromiseResult> = Readonly<{
    real: Def["data"]
    result: PromiseResult
}>

export type AtomRemNode_Action_Patch_Set_Request<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"]
> = Readonly<{
    promise: Promise<PromiseResult>
    promise_interpret: (api: AtomRemNode_Action_Patch_Set_InterpretApi<Def, PromiseResult>) => Partial<Def["data"]> | null

    promise_abort?: () => void
}>

export type AtomRemNode_Action_Patch_Set_Data<Data> = (
    | Readonly<{
        kind: "flat"
        merge: boolean
        value: Partial<Data>
    }>
    | Readonly<{
        kind: "flat:factory"
        value: (old: Partial<Data> | null) => Partial<Data>
    }>
    | Readonly<{
        kind: "modifier"
        value: (data: Data) => Data | undefined | void
    }>
)

export type AtomRemNode_Action_Patch_Set_Params<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"]
> = Readonly<{
    name: string
    node: AtomRemNode<Def>
    data: AtomRemNode_Action_Patch_Set_Data<Def["data"]>
    request: AtomRemNode_Action_Patch_Set_Request<Def, PromiseResult>
}>

const data_new = function <Data>(
    old_data: AtomRemNode_OptimisticValue<Data> | undefined | null,
    data: AtomRemNode_Action_Patch_Set_Data<Data>
): AtomRemNode_OptimisticValue<Data> {
    switch (data.kind) {
        case "flat": {
            if (data.merge && typeof old_data === "object") {
                return {
                    ...old_data,
                    ...data.value
                }
            }

            return data.value
        }
        case "flat:factory": {
            if (typeof old_data === "object") {
                return data.value(old_data)
            }

            return data.value(null)
        }
        case "modifier": {
            return data.value
        }
    }
}

export const atomremnode_action_patch_set = function <
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"] = Def["request_result"]
>(
    params: AtomRemNode_Action_Patch_Set_Params<Def, PromiseResult>
): AtomAction {
    return ({ reg }) => {
        const controller = new AbortController()

        const remdata = reg(params.node)
        const optimistic = reg(remdata.optimistic).reg(params.name)
        const data = data_new(optimistic.output()?.data, params.data)

        optimistic.input({
            data,

            abort: () => {
                controller.abort()

                params.request.promise_abort?.()
            },

            promise: new Promise<void>((resolve, reject) => {
                let listener_abort: VoidFunction | null = null

                const cleanup = () => {
                    real_cleanup()

                    controller.signal.removeEventListener("abort", controller_abort)
                }

                const controller_abort = () => {
                    cleanup()

                    reject()
                }

                const real_listener = () => {
                    const target_o = reg(remdata.real).output()

                    let listener_aborted = false

                    if (target_o.status === ReqState__Status.Fulfilled && !listener_abort) {
                        listener_abort = () => { listener_aborted = true }

                        params.request.promise.then(result => {
                            if (listener_aborted || controller.signal.aborted) { return }

                            const real = reg(remdata.real)
                            const real_prev = real.output()

                            if (real_prev.status === ReqState__Status.Fulfilled) {
                                const interpretation = params.request.promise_interpret({
                                    result,
                                    real: real_prev
                                })

                                if (interpretation) {
                                    real.input({
                                        ...real_prev,

                                        data: {
                                            ...real_prev.data,
                                            ...interpretation
                                        }
                                    })
                                }

                                resolve()

                                cleanup()
                            } else {
                                reject()

                                cleanup()
                            }
                        }, () => {
                            if (listener_aborted || controller.signal.aborted) { return }

                            reject()

                            cleanup()
                        })
                    } else {
                        if (listener_abort) {
                            listener_abort()

                            listener_abort = null
                        }

                        // if empty cleanup and finish
                        if (target_o.status === ReqState__Status.Empty) {
                            reject()

                            cleanup()
                        }
                    }
                }

                const real_cleanup = sc.signal_listen({
                    target: reg(remdata.real),
                    listener: real_listener,

                    config: {
                        emit: true
                    },
                })

                controller.signal.addEventListener("abort", controller_abort)
            })
        })
    }
}
