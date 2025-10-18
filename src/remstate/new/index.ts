import type { AtomRemState_Value } from "#src/remstate/type/AtomRemote.js";
import { reqstate_new_empty } from "#src/reqstate/new/empty.js";
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js";
import { reqstate_new_pending } from "#src/reqstate/new/pending.js";
import { ReqState__Status, type ReqState, type ReqState_Pending } from "#src/reqstate/type/State.js";
import * as sc from "@qyu/signal-core";

export const remstate_new = function <T, PR, PM>(init: ReqState<T>): AtomRemState_Value<T, PR, PM> {
    const state = sc.signal_new_value(init)

    const promise_wrap = (input: ReqState_Pending<T, PR, PM>): ReqState<T> => {
        let interrupted = false

        input.request_promise.then(
            result => {
                if (interrupted) { return }

                const next_reqstate = input.request_interpret(result)

                switch (next_reqstate.status) {
                    case ReqState__Status.Empty: {
                        if (input.fallback) {
                            state.input(reqstate_new_fulfilled(input.fallback))

                        } else {
                            state.input(next_reqstate)
                        }

                        break
                    }
                    case ReqState__Status.Fulfilled: {
                        state.input(next_reqstate)

                        break
                    }
                    case ReqState__Status.Pending: {
                        state.input(promise_wrap(next_reqstate))

                        break
                    }
                }
            },
            () => {
                if (interrupted) { return }

                state.input(reqstate_new_empty())
            }
        )

        return reqstate_new_pending({
            optimistic: input.optimistic,
            meta: input.meta,
            fallback: input.fallback,

            request_interpret: input.request_interpret,
            request_promise: input.request_promise,

            request_abort: () => {
                if (!interrupted) {
                    interrupted = true

                    if (input.fallback) {
                        state.input(reqstate_new_fulfilled(input.fallback))
                    } else {
                        state.input(reqstate_new_empty())
                    }

                    input.request_abort()
                }
            },
        })
    }

    return sc.signal_new_pipei(state, (input: ReqState<T>) => {
        const state_o = state.output()

        if (state_o.status === ReqState__Status.Pending) {
            state_o.request_abort()
        }

        switch (input.status) {
            case ReqState__Status.Fulfilled:
            case ReqState__Status.Empty: {
                return input
            }
            case ReqState__Status.Pending: {
                return promise_wrap(input)
            }
        }
    })
}
