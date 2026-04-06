import type { RemNode } from "#src/remnode/type/def.js"
import { ReqState_Status } from "#src/reqstate/type/state.js"
import { abort_merge } from "#src/util/abort/merge.js"
import * as sc from "@qyu/signal-core"

type RequestState<PrR> = {
    promise: Promise<PrR>
    controller_abort: AbortController
}

export type Promise_NewRemDeps_RequestParams = {
    readonly signal_abort: AbortSignal
}

export type Promise_NewRemDeps_Params<PrR> = {
    readonly deps: readonly RemNode<any>[]
    readonly request_new: (params: Promise_NewRemDeps_RequestParams) => Promise<PrR>

    readonly signal_abort?: AbortSignal
}

export const promise_new_remdeps = function <PrR>(params: Promise_NewRemDeps_Params<PrR>): Promise<PrR> {
    const controller_abort = new AbortController()
    const signal_abort = abort_merge([controller_abort.signal, params.signal_abort])

    const deps_real_s = sc.osignal_new_merge(params.deps.map(dep => dep.real))

    return new Promise((resolve, reject) => {
        if (signal_abort.aborted) {
            reject(new Error("aborted"))
        }

        let request: RequestState<PrR> | null = null

        const abort = () => {
            deps_real_s.rmsub(sub)
            signal_abort.removeEventListener("abort", abort)

            if (request) {
                const l_request = request

                request = null

                l_request.controller_abort.abort()
            }

            reject(new Error("aborted"))
        }

        const sub = () => {
            const deps_real = deps_real_s.output()

            for (const dep_real of deps_real) {
                switch (dep_real.status) {
                    case ReqState_Status.Empty: {
                        deps_real_s.rmsub(sub)
                        signal_abort.removeEventListener("abort", abort)

                        if (request) {
                            const l_request = request

                            request = null

                            l_request.controller_abort.abort()
                        }

                        reject(new Error(`Waiting for dependencies: one of dependencies is empty`))

                        return
                    }
                    case ReqState_Status.Pending:
                        if (request) {
                            const l_request = request

                            request = null

                            l_request.controller_abort.abort()
                        }

                        // not ready
                        return
                    case ReqState_Status.Fulfilled:
                        continue
                }
            }

            const l_controller_abort = new AbortController()
            const l_request = params.request_new({
                signal_abort: abort_merge([l_controller_abort.signal, signal_abort]),
            })

            l_request.then(response => {
                if (!l_controller_abort.signal.aborted) {
                    deps_real_s.rmsub(sub)
                    signal_abort.removeEventListener("abort", abort)

                    resolve(response)
                }
            }, reason => {
                if (!l_controller_abort.signal.aborted) {
                    deps_real_s.rmsub(sub)
                    signal_abort.removeEventListener("abort", abort)

                    reject(reason)
                }
            })

            request = {
                promise: l_request,
                controller_abort: l_controller_abort,
            }
        }

        signal_abort.addEventListener("abort", abort)
        deps_real_s.addsub(sub)

        sub()
    })
}
