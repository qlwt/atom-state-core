import type { AtomRemReq, AtomRemReq_State } from "#src/remreq/type/State.js"
import { atomvalue_new } from "#src/value/atom/index.js"
import * as sc from "@qyu/signal-core"

export const atomremreq_new = function <Data>(): AtomRemReq<Data> {
    return atomvalue_new(() => {
        const state = sc.signal_new_value<AtomRemReq_State<Data> | null>(null)

        return {
            input: (message: AtomRemReq_State<Data> | null) => {
                state.output()?.abort()

                let interrupted = false

                if (message) {
                    message.promise.then(() => {
                        if (interrupted) { return }

                        state.input(null)
                    }, () => {
                        if (interrupted) { return }

                        state.input(null)
                    })

                    state.input({
                        ...message,

                        abort: () => {
                            interrupted = true

                            message.abort()
                        }
                    })
                } else {
                    state.input(null)
                }
            },

            output: () => {
                return state.output()
            },

            rmsub: sub => {
                state.rmsub(sub)
            },

            addsub: (sub, config) => {
                state.addsub(sub, config)
            },
        }
    })
}
