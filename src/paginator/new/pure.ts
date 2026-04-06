import { type PaginatorPure } from "#src/paginator/type/pure.js"
import { Paginator_Status } from "#src/paginator/type/status.js"
import * as sc from "@qyu/signal-core"

export type Paginator_NewPure_RequestApi<Cursor> = {
    readonly cursor: Cursor
    readonly signal_abort: AbortSignal
}

export type Paginator_NewPure_RequestRes<Cursor> = {
    readonly cursor: { readonly value: Cursor } | null
}

export type Paginator_NewPure_Request<Cursor> = {
    (api: Paginator_NewPure_RequestApi<Cursor>): (
        Promise<Paginator_NewPure_RequestRes<Cursor>>
    )
}

export type Paginator_NewPure_Config_Retry = {
    readonly delay?: number | null
}

export type Paginator_NewPure_Config = {
    readonly retry?: Paginator_NewPure_Config_Retry
}

export type Paginator_NewPure_Init<Cursor> = {
    readonly cursor: { readonly value: Cursor } | null
}

export type Paginator_NewPure_Params<Cursor> = {
    readonly config?: Paginator_NewPure_Config
    readonly init: Paginator_NewPure_Init<Cursor>
    readonly request_new: Paginator_NewPure_Request<Cursor>
}

const fallback = function <T, F>(value: T | undefined, fallback: F): T | F {
    if (value === undefined) {
        return fallback
    }

    return fallback
}

export const paginator_new_pure__config_deps = function(
    config: Paginator_NewPure_Config | undefined | null,
    config_fallback?: Paginator_NewPure_Config | undefined | null
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

export const paginator_new_pure = function <Cursor>(
    params: Paginator_NewPure_Params<Cursor>
): PaginatorPure {
    const nprop_retry_delay = params.config?.retry?.delay ?? null

    let lasterror_timestamp: number | null = null
    let controller_abort: AbortController | null = null
    let cursor: { readonly value: Cursor } | null = params.init.cursor

    const status = sc.signal_new_value(cursor === null ? Paginator_Status.Fulfilled : Paginator_Status.Idle)

    return {
        status,

        clear: () => {
            if (controller_abort) {
                const l_controller_abort = controller_abort

                controller_abort = null

                l_controller_abort.abort()
                status.input(cursor === null ? Paginator_Status.Fulfilled : Paginator_Status.Idle)
            }
        },

        load: () => {
            if (!cursor || status.output() !== Paginator_Status.Idle) {
                return
            }

            const l_cursor = cursor
            const l_controller_abort = new AbortController()

            controller_abort = l_controller_abort

            status.input(Paginator_Status.Pending)

            if (nprop_retry_delay !== null && lasterror_timestamp !== null && Date.now() - lasterror_timestamp < nprop_retry_delay) {
                setTimeout(
                    () => {
                        if (l_controller_abort.signal.aborted) { return }

                        const request = params.request_new({
                            cursor: l_cursor.value,
                            signal_abort: l_controller_abort.signal,
                        })

                        request.then(response => {
                            if (l_controller_abort.signal.aborted) { return }

                            controller_abort = null
                            cursor = response.cursor

                            if (response.cursor === null) {
                                status.input(Paginator_Status.Fulfilled)
                            } else {
                                status.input(Paginator_Status.Idle)
                            }
                        }, () => {
                            if (l_controller_abort.signal.aborted) { return }

                            controller_abort = null
                            lasterror_timestamp = Date.now()

                            status.input(Paginator_Status.Idle)
                        })
                    },
                    nprop_retry_delay - (Date.now() - lasterror_timestamp)
                )
            } else {
                const request = params.request_new({
                    cursor: l_cursor.value,
                    signal_abort: controller_abort.signal
                })

                request.then(response => {
                    if (l_controller_abort.signal.aborted) { return }

                    controller_abort = null
                    cursor = response.cursor

                    if (response.cursor === null) {
                        status.input(Paginator_Status.Fulfilled)
                    } else {
                        status.input(Paginator_Status.Idle)
                    }
                }, () => {
                    if (l_controller_abort.signal.aborted) { return }

                    controller_abort = null
                    lasterror_timestamp = Date.now()

                    status.input(Paginator_Status.Idle)
                })
            }
        },
    }
}
