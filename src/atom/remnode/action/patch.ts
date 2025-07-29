import type { AtomAction } from "#src/atom/action/type/AtomAction.js"
import type { AtomRemNode, AtomRemNode_Def } from "#src/atom/remnode/type/State.js"
import { ReqState__Status } from "#src/reqstate/type/State.js"
import * as sc from "@qyu/signal-core"

export type AtomRemNode_Action_Patch_Request_Params<Def extends AtomRemNode_Def> = Readonly<{
    real: Def["data"]
    data: Partial<Def["data"]>
}>

export type AtomRemNode_Action_Patch_Request<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"]
> = Readonly<{
    promise_after?: (promise: Promise<PromiseResult>) => void

    promise: Promise<PromiseResult>
    promise_abort: VoidFunction
    promise_interpret: (result: PromiseResult) => Partial<Def["data"]> | null
}>

export type AtomRemNode_Action_Patch_Config = Readonly<{
    merge: boolean
    delay?: number | null
}>

export type AtomRemNode_Action_Patch_Params<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"]
> = Readonly<{
    name: string
    node: AtomRemNode<Def>
    data: Partial<Def["data"]>
    config: AtomRemNode_Action_Patch_Config
    request: (params: AtomRemNode_Action_Patch_Request_Params<Def>) => AtomRemNode_Action_Patch_Request<Def, PromiseResult>
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

const delay = function(action: VoidFunction, ondelay: (id: NodeJS.Timeout) => void, delay: null | number | undefined): void {
    if (typeof delay !== "number") {
        action()
    } else {
        const id = setTimeout(action, delay)

        ondelay(id)
    }
}

export const atomremnode_action_patch = function <
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"] = Def["request_result"]
>(
    params: AtomRemNode_Action_Patch_Params<Def, PromiseResult>
): AtomAction {
    return ({ reg }) => {
        const controller = new AbortController()

        const remdata = reg(params.node)
        const optimistic_family = reg(remdata.optimistic)
        const optimistic_reqdata = optimistic_family.reg(params.name)
        const data = data_new(optimistic_reqdata.output()?.data, params.data, params.config.merge)

        optimistic_reqdata.input({
            data,
            abort: () => controller.abort(),

            promise: new Promise<void>((resolve, reject) => {
                let state_request: AtomRemNode_Action_Patch_Request<Def, PromiseResult> | undefined
                let delay_id: NodeJS.Timeout | null = null

                const cleanup = () => {
                    real_cleanup()

                    controller.signal.removeEventListener("abort", controller_abort)

                    if (state_request) {
                        state_request.promise_abort()

                        state_request = undefined
                    }

                    if (delay_id !== null) {
                        clearTimeout(delay_id)

                        delay_id = null
                    }
                }

                const controller_abort = () => {
                    cleanup()

                    reject()
                }

                const real_listener = () => {
                    const target_o = reg(remdata.real).output()

                    let aborted = false

                    if (target_o.status === ReqState__Status.Fulfilled) {
                        // if fulfilled and no request ongoing - begin request
                        if (!state_request && delay_id === null) {
                            delay(() => {
                                delay_id = null

                                // create request
                                const request_original = params.request({
                                    data,

                                    real: target_o.data
                                })

                                // add custom abort
                                const request_parsed = {
                                    ...request_original,

                                    abort: () => {
                                        aborted = true

                                        request_original.promise_abort()
                                    }
                                }

                                // reasign state_request
                                state_request = request_parsed

                                // reject or resolve top level promise on success if not aborted
                                request_parsed.promise.then(result => {
                                    if (aborted || controller.signal.aborted) { return }

                                    const interpretation = request_parsed.promise_interpret(result)

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
                                    if (aborted || controller.signal.aborted) { return }

                                    reject()

                                    cleanup()
                                })

                                // add custom after promise event
                                request_parsed.promise_after?.(request_parsed.promise)
                            }, timeout => {
                                delay_id = timeout
                            }, params.config.delay)
                        }
                    } else {
                        // if not fulfilled stop current request
                        if (state_request) {
                            state_request.promise_abort()

                            state_request = undefined
                        }

                        if (delay_id !== null) {
                            clearTimeout(delay_id)

                            delay_id = null
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
