import type { AtomAction } from "#src/atom/action/type/AtomAction.js"
import * as sc from "@qyu/signal-core"
import type { AtomRemNode, AtomRemNode_Def } from "#src/atom/remnode/type/State.js"
import { ReqState__Status } from "#src/reqstate/type/State.js"

export type AtomRemNode_Action_Patch_Set_Request<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"]
> = Readonly<{
    promise: Promise<PromiseResult>
    promise_interpret: (result: PromiseResult, optimistic: Partial<Def["data"]>) => Partial<Def["data"]> | null

    promise_abort?: () => void
}>

export type AtomRemNode_Action_Patch_Set_Config = Readonly<{
    merge: boolean
}>

export type AtomRemNode_Action_Patch_Set_Params<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"]
> = Readonly<{
    name: string
    node: AtomRemNode<Def>
    data: Partial<Def["data"]>
    config: AtomRemNode_Action_Patch_Set_Config
    request: AtomRemNode_Action_Patch_Set_Request<Def, PromiseResult>
}>

const data_new = function <Data>(old_data: Partial<Data> | null | undefined, now_data: Partial<Data>, merge: boolean): Partial<Data> {
    if (merge) {
        return {
            ...old_data,
            ...now_data
        }
    }

    return now_data
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
        const data = data_new(optimistic.output()?.data, params.data, params.config.merge)

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

                            const interpretation = params.request.promise_interpret(result, data)

                            if (interpretation) {
                                const real = reg(remdata.real)
                                const real_prev = real.output()

                                if (real_prev.status === ReqState__Status.Fulfilled) {
                                    real.input({
                                        ...real_prev,

                                        data: {
                                            ...real_prev.data,

                                            ...data
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
