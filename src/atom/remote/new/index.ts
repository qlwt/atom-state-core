import type { AtomRemote } from "#src/atom/remote/type/AtomRemote.js";
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js";
import { atomvalue_new } from "#src/atom/value/new/index.js";
import { reqphase_new_empty } from "#src/request-phase/new/empty.js";
import { reqphase_new_pending } from "#src/request-phase/new/pending.js";
import { RequestPhase_Status, type RequestPhase, type RequestPhase_Pending } from "#src/request-phase/type/RequestPhase.js";
import * as sc from "@qyu/signal-core";

export const atomremote_new = function <T>(init: AtomSelectorStatic<RequestPhase<T>>): AtomRemote<T> {
    return atomvalue_new(store => {
        const state = sc.signal_new_value(init(store))

        const promise_wrap = (input: RequestPhase_Pending<T>): RequestPhase<T> => {
            let interrupted = false

            input.promise.catch(() => {
                if (interrupted) { return }

                state.input(reqphase_new_empty())
            })

            input.promise.then(next_reqphase => {
                if (interrupted) { return }

                switch (next_reqphase.status) {
                    case RequestPhase_Status.Empty:
                    case RequestPhase_Status.Fulfilled: {
                        state.input(next_reqphase)

                        break
                    }
                    case RequestPhase_Status.Pending: {
                        state.input(promise_wrap(next_reqphase))

                        break
                    }
                }
            })

            return reqphase_new_pending({
                promise: input.promise.catch(() => {
                    return reqphase_new_empty()
                }),

                abort: () => {
                    interrupted = true

                    input.abort()
                }
            })
        }

        return sc.signal_new_pipei(state, (input: RequestPhase<T>) => {
            const state_o = state.output()

            if (state_o.status === RequestPhase_Status.Pending) {
                state_o.abort()
            }

            switch (input.status) {
                case RequestPhase_Status.Fulfilled:
                case RequestPhase_Status.Empty: {
                    return input
                }
                case RequestPhase_Status.Pending: {
                    return promise_wrap(input)
                }
            }
        })
    })
}
