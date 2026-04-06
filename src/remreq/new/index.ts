import type { RemReq_State, RemReq } from "#src/remreq/type/state.js"
import * as sc from "@qyu/signal-core"

export const remreq_new = function <Data>(): RemReq<Data> {
    const state = sc.signal_new_value<RemReq_State<Data> | null>(null)

    return {
        ...state,

        input: (message: RemReq_State<Data> | null) => {
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
    }
}
