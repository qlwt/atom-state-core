import type { AtomLoader } from "#src/atom/loader/type/AtomLoader.js"
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js"
import { atomvalue_new } from "#src/atom/value/new/index.js"
import type { Throttler } from "#src/throttler/type/Throttler.js"

enum Status {
    Idle,
    Connected,
    TerminationScheduled,
    InitializationScheduled,
    ReInitializationScheduled
}

type State<P extends readonly unknown[]> = (
    | {
        readonly status: Status.Idle
    }
    | {
        readonly status: Status.Connected
        readonly top: P
        readonly connection_terminate: VoidFunction
    }
    | {
        readonly status: Status.TerminationScheduled
        readonly operation_cancel: VoidFunction
        readonly connection_terminate: VoidFunction
    }
    | {
        readonly status: Status.InitializationScheduled
        readonly operation_cancel: VoidFunction
        readonly top: P
    }
    | {
        readonly status: Status.ReInitializationScheduled
        readonly operation_cancel: VoidFunction
        readonly connection_terminate: VoidFunction
        readonly top: P
    }
)

const findtop = function <T>(list: readonly T[], comparator: (a: T, b: T) => number): T | undefined {
    let top: undefined | T = list[0]

    for (let i = 1; i < list.length; ++i) {
        const list_item = list[i]!

        if (comparator(list_item, top!) >= 0) {
            top = list_item
        }
    }

    return top
}

export type AtomLoader_New_Concurrent_Params<P extends readonly unknown[]> = {
    readonly throttler: Throttler
    readonly comparator: (a: P, b: P) => number
    readonly connect: (...params: P) => AtomSelectorStatic<VoidFunction>
}

export const atomloader_new_concurrent = function <P extends readonly unknown[]>(
    params_loader: AtomLoader_New_Concurrent_Params<P>
): AtomLoader<P> {
    const { comparator, throttler, connect } = params_loader

    return atomvalue_new(store => {
        let state = { status: Status.Idle } as State<P>

        const stack = new Array<P>()

        return {
            request: (...params) => {
                stack.push(params)

                switch (state.status) {
                    case Status.Idle: {
                        const throttler_controls = throttler(() => {
                            state = {
                                status: Status.Connected,
                                top: params,
                                connection_terminate: connect(...params)(store)
                            }
                        })

                        state = {
                            status: Status.InitializationScheduled,
                            top: params,
                            operation_cancel: throttler_controls.interrupt,
                        }

                        throttler_controls.emit()

                        break
                    }
                    case Status.ReInitializationScheduled: {
                        if (comparator(params, state.top) >= 0) {
                            state.operation_cancel()

                            const { connection_terminate } = state

                            const throttler_controls = throttler(() => {
                                connection_terminate()

                                state = {
                                    status: Status.Connected,
                                    top: params,
                                    connection_terminate: connect(...params)(store)
                                }
                            })

                            state = {
                                status: Status.ReInitializationScheduled,
                                top: params,
                                connection_terminate,
                                operation_cancel: throttler_controls.interrupt
                            }

                            throttler_controls.emit()
                        }

                        break
                    }
                    case Status.Connected: {
                        if (comparator(params, state.top) >= 0) {
                            const { connection_terminate } = state

                            const throttler_controls = throttler(() => {
                                connection_terminate()

                                state = {
                                    status: Status.Connected,
                                    top: params,
                                    connection_terminate: connect(...params)(store)
                                }
                            })

                            state = {
                                status: Status.ReInitializationScheduled,
                                top: params,
                                connection_terminate,

                                operation_cancel: throttler_controls.interrupt
                            }

                            throttler_controls.emit()
                        }

                        break
                    }
                    case Status.TerminationScheduled: {
                        state.operation_cancel()

                        const { connection_terminate } = state

                        const throttler_controls = throttler(() => {
                            connection_terminate()

                            state = {
                                status: Status.Connected,
                                top: params,
                                connection_terminate: connect(...params)(store)
                            }
                        })

                        state = {
                            status: Status.ReInitializationScheduled,
                            top: params,
                            connection_terminate,

                            operation_cancel: throttler_controls.interrupt
                        }

                        throttler_controls.emit()

                        break
                    }
                    case Status.InitializationScheduled: {
                        if (comparator(params, state.top) >= 0) {
                            state.operation_cancel()

                            const throttler_controls = throttler(() => {
                                state = {
                                    status: Status.Connected,
                                    top: params,
                                    connection_terminate: connect(...params)(store)
                                }
                            })

                            state = {
                                status: Status.InitializationScheduled,
                                top: params,
                                operation_cancel: throttler_controls.interrupt
                            }

                            throttler_controls.emit()
                        }

                        break
                    }
                }

                return () => {
                    const index = stack.indexOf(params)

                    if (index !== -1) {
                        stack.splice(index, 1)

                        switch (state.status) {
                            case Status.Connected: {
                                if (state.top === params) {
                                    const { connection_terminate } = state
                                    const next_top = findtop(stack, comparator)

                                    if (next_top === undefined) {
                                        const throttler_controls = throttler(() => {
                                            connection_terminate()

                                            state = {
                                                status: Status.Idle
                                            }
                                        })

                                        state = {
                                            status: Status.TerminationScheduled,
                                            operation_cancel: throttler_controls.interrupt,
                                            connection_terminate: state.connection_terminate,
                                        }

                                        throttler_controls.emit()
                                    } else {
                                        const throttler_controls = throttler(() => {
                                            connection_terminate()

                                            state = {
                                                status: Status.Connected,
                                                top: next_top,
                                                connection_terminate: connect(...next_top)(store),
                                            }
                                        })

                                        state = {
                                            status: Status.ReInitializationScheduled,
                                            top: next_top,
                                            connection_terminate,
                                            operation_cancel: throttler_controls.interrupt
                                        }

                                        throttler_controls.emit()
                                    }
                                }

                                break
                            }
                            case Status.InitializationScheduled: {
                                state.operation_cancel()

                                state = {
                                    status: Status.Idle
                                }

                                break
                            }
                            case Status.ReInitializationScheduled: {
                                if (state.top === params) {
                                    state.operation_cancel()

                                    const { connection_terminate } = state
                                    const next_top = findtop(stack, comparator)

                                    if (next_top === undefined) {
                                        const throttler_controls = throttler(() => {
                                            connection_terminate()

                                            state = {
                                                status: Status.Idle
                                            }
                                        })

                                        state = {
                                            status: Status.TerminationScheduled,
                                            operation_cancel: throttler_controls.interrupt,
                                            connection_terminate: state.connection_terminate,
                                        }

                                        throttler_controls.emit()
                                    } else {
                                        const throttler_controls = throttler(() => {
                                            connection_terminate()

                                            state = {
                                                status: Status.Connected,
                                                top: next_top,
                                                connection_terminate: connect(...next_top)(store)
                                            }
                                        })

                                        state = {
                                            status: Status.ReInitializationScheduled,
                                            top: next_top,
                                            connection_terminate,
                                            operation_cancel: throttler_controls.interrupt
                                        }

                                        throttler_controls.emit()
                                    }
                                }

                                break
                            }
                        }
                    }
                }
            }
        }
    })
}
