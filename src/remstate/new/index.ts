import type { RemState, RemState_MessagePushPending } from "#src/remstate/type/remstate.js";
import { reqstate_new_empty } from "#src/reqstate/new/empty.js";
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js";
import { reqstate_new_pending } from "#src/reqstate/new/pending.js";
import { ReqState_Status, type ReqState, type ReqState_Pending } from "#src/reqstate/type/state.js";
import * as sc from "@qyu/signal-core";

function pending_new<T, PR, PM>(
    state: sc.Signal<ReqState<T, PR, PM>>,
    message: RemState_MessagePushPending<T, PR, PM>
): ReqState_Pending<T, PR, PM> {
    let finished = false
    let interrupted = false

    const abort = () => {
        if (interrupted || finished) { return }

        interrupted = true

        message.signal_abort?.removeEventListener("abort", abort)

        sc.batcher.batch_sync(() => {
            if (message.fallback) {
                state.input(reqstate_new_fulfilled(message.fallback.value))
            } else {
                state.input(reqstate_new_empty({}))
            }

            message.request_abort()
        })
    }

    message.signal_abort?.addEventListener("abort", abort)

    message.request_promise.then(
        result => {
            if (interrupted) { return }

            finished = true
            message.signal_abort?.removeEventListener("abort", abort)

            const next_message = message.request_interpret(result)

            switch (next_message.status) {
                case ReqState_Status.Empty: {
                    if (message.fallback) {
                        state.input(reqstate_new_fulfilled(message.fallback.value))
                    } else {
                        state.input(next_message)
                    }

                    break
                }
                case ReqState_Status.Fulfilled: {
                    state.input(next_message)

                    break
                }
                case ReqState_Status.Pending: {
                    state.input(pending_new(state, next_message))

                    break
                }
            }
        },
        (reason) => {
            if (interrupted) { return }

            finished = true
            message.signal_abort?.removeEventListener("abort", abort)

            if (message.fallback) {
                state.input(reqstate_new_fulfilled(
                    message.fallback.value
                ))
            } else {
                state.input(reqstate_new_empty({
                    error: { value: reason }
                }))
            }
        }
    )

    const result = reqstate_new_pending({
        optimistic: message.optimistic,
        meta: message.meta,
        fallback: message.fallback,

        request_interpret: message.request_interpret,
        request_promise: message.request_promise,

        request_abort: () => {
            abort()
        },
    })

    return result
}

export const remstate_new = function <T, PR, PM>(init: ReqState<T>): RemState<T, PR, PM> {
    const state = sc.signal_new_value(init)


    return {
        ...state,

        input: message => {
            sc.batcher.batch_sync(() => {
                switch (message.status) {
                    case "set-hard": {
                        state.input(message.reqstate)

                        break
                    }
                    case ReqState_Status.Empty: {
                        const state_o = state.output()

                        if (state_o.status === ReqState_Status.Pending) {
                            state_o.request_abort()
                        }

                        state.input(reqstate_new_empty({
                            error: message.error,
                        }))

                        break
                    }
                    case ReqState_Status.Fulfilled: {
                        const state_o = state.output()

                        if (state_o.status === ReqState_Status.Pending) {
                            state_o.request_abort()
                        }

                        state.input(reqstate_new_fulfilled(message.data))

                        break
                    }
                    case ReqState_Status.Pending: {
                        const state_o = state.output()

                        if (state_o.status === ReqState_Status.Pending) {
                            state_o.request_abort()
                        }

                        state.input(pending_new(state, message))

                        break
                    }
                }
            })

        }
    }
}
