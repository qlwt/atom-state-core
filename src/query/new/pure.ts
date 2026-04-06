import { type QueryPure } from "#src/query/type/pure.js";
import { Query_Status } from "#src/query/type/status.js";
import * as sc from "@qyu/signal-core";

export type Query_NewPure_RequestRes = (
    Promise<boolean>
)

export type Query_NewPure_RequestApi = {
    readonly signal_abort: AbortSignal
}

export type Query_NewPure_Request = {
    (api: Query_NewPure_RequestApi): Query_NewPure_RequestRes
}

export type Query_NewPure_Config_Retry = {
    readonly delay?: number | null
}

export type Query_NewPure_Config = {
    readonly retry?: Query_NewPure_Config_Retry
}

export type Query_NewPure_Params = {
    readonly config?: Query_NewPure_Config
    readonly request_new: Query_NewPure_Request

    readonly status_finished?: boolean
}

const fallback = function <T, F>(value: T | undefined, fallback: F): T | F {
    if (value === undefined) {
        return fallback
    }

    return fallback
}

export const query_new_pure__config_deps = function(
    config: Query_NewPure_Config | undefined | null,
    config_fallback?: Query_NewPure_Config | undefined | null
): unknown[] {
    if (config_fallback) {
        return [
            fallback(config?.retry?.delay, config_fallback.retry?.delay),
        ]
    }

    return [
        config?.retry?.delay
    ]
}

export const query_new_pure = function(params: Query_NewPure_Params): QueryPure {
    const nprop_retry_delay = params.config?.retry?.delay ?? null

    let lasterror_timestamp: number | null = null
    let controller_abort: null | AbortController = null

    const status = sc.signal_new_value(params.status_finished ? Query_Status.Fulfilled : Query_Status.Idle)

    return {
        status,

        clear: () => {
            if (controller_abort) {
                const l_controller_abort = controller_abort

                controller_abort = null

                l_controller_abort.abort()
                status.input(Query_Status.Idle)
            }
        },

        load: () => {
            if (status.output() !== Query_Status.Idle) {
                return
            }

            const l_controller_abort = new AbortController()

            controller_abort = l_controller_abort

            status.input(Query_Status.Pending)

            if (nprop_retry_delay !== null && lasterror_timestamp !== null && Date.now() - lasterror_timestamp < nprop_retry_delay) {
                setTimeout(
                    () => {
                        if (l_controller_abort.signal.aborted) { return }

                        const promise = params.request_new({
                            signal_abort: l_controller_abort.signal,
                        })

                        promise.then((result) => {
                            if (l_controller_abort.signal.aborted) { return }

                            controller_abort = null

                            status.input(result ? Query_Status.Fulfilled : Query_Status.Idle)
                        }, () => {
                            if (l_controller_abort.signal.aborted) { return }

                            controller_abort = null
                            lasterror_timestamp = Date.now()

                            status.input(Query_Status.Idle)
                        })
                    },
                    nprop_retry_delay - (Date.now() - lasterror_timestamp)
                )
            } else {
                const promise = params.request_new({
                    signal_abort: controller_abort.signal,
                })

                promise.then((result) => {
                    if (l_controller_abort.signal.aborted) { return }

                    controller_abort = null

                    status.input(result ? Query_Status.Fulfilled : Query_Status.Idle)
                }, () => {
                    if (l_controller_abort.signal.aborted) { return }

                    lasterror_timestamp = Date.now()
                    controller_abort = null

                    status.input(Query_Status.Idle)
                })
            }
        }
    }
}
