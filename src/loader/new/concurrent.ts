import type { Loader } from "#src/loader/type/loader.js"
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"

enum Status {
    Idle,
    Connected,
    TerminationScheduled,
    InitializationScheduled,
    ReInitializationScheduled
}

type State<Param> = (
    | {
        readonly status: Status.Idle
    }
    | {
        readonly status: Status.Connected
        readonly top: Param
        readonly connection_terminate: VoidFunction
    }
    | {
        readonly status: Status.TerminationScheduled
        readonly connection_terminate: VoidFunction
    }
    | {
        readonly status: Status.InitializationScheduled
        readonly top: Param
    }
    | {
        readonly status: Status.ReInitializationScheduled
        readonly connection_terminate: VoidFunction
        readonly top: Param
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

export type Loader_NewConcurrent_Params<Param> = {
    readonly callbatcher: CallBatcher
    readonly connect: (params: Param) => VoidFunction
    readonly comparator: (a: Param, b: Param) => number
}

export const loader_new_concurrent = function <Param>(
    params_loader: Loader_NewConcurrent_Params<Param>
): Loader<Param> {
    const { comparator, callbatcher: throttler, connect } = params_loader

    let state = { status: Status.Idle } as State<Param>

    const stack = new Array<Param>()

    return {
        request: (param) => {
            stack.push(param)

            switch (state.status) {
                case Status.Idle: {
                    state = {
                        status: Status.InitializationScheduled,
                        top: param,
                    }

                    throttler.emit(() => {
                        state = {
                            status: Status.Connected,
                            top: param,
                            connection_terminate: connect(param)
                        }
                    })

                    break
                }
                case Status.ReInitializationScheduled: {
                    if (comparator(param, state.top) >= 0) {
                        throttler.interrupt()

                        const { connection_terminate } = state

                        state = {
                            status: Status.ReInitializationScheduled,
                            top: param,
                            connection_terminate,
                        }

                        throttler.emit(() => {
                            connection_terminate()

                            state = {
                                status: Status.Connected,
                                top: param,
                                connection_terminate: connect(param)
                            }
                        })
                    }

                    break
                }
                case Status.Connected: {
                    if (comparator(param, state.top) >= 0) {
                        const { connection_terminate } = state


                        state = {
                            status: Status.ReInitializationScheduled,
                            top: param,
                            connection_terminate,
                        }

                        throttler.emit(() => {
                            connection_terminate()

                            state = {
                                status: Status.Connected,
                                top: param,
                                connection_terminate: connect(param)
                            }
                        })
                    }

                    break
                }
                case Status.TerminationScheduled: {
                    throttler.interrupt()

                    const { connection_terminate } = state

                    state = {
                        status: Status.ReInitializationScheduled,
                        top: param,
                        connection_terminate,
                    }

                    throttler.emit(() => {
                        connection_terminate()

                        state = {
                            status: Status.Connected,
                            top: param,
                            connection_terminate: connect(param)
                        }
                    })

                    break
                }
                case Status.InitializationScheduled: {
                    if (comparator(param, state.top) >= 0) {
                        throttler.interrupt()

                        state = {
                            status: Status.InitializationScheduled,
                            top: param,
                        }

                        throttler.emit(() => {
                            state = {
                                status: Status.Connected,
                                top: param,
                                connection_terminate: connect(param)
                            }
                        })
                    }

                    break
                }
            }

            return () => {
                const index = stack.indexOf(param)

                if (index !== -1) {
                    stack.splice(index, 1)

                    switch (state.status) {
                        case Status.Connected: {
                            if (state.top === param) {
                                const { connection_terminate } = state
                                const next_top = findtop(stack, comparator)

                                if (next_top === undefined) {
                                    state = {
                                        status: Status.TerminationScheduled,
                                        connection_terminate: state.connection_terminate,
                                    }

                                    throttler.emit(() => {
                                        connection_terminate()

                                        state = {
                                            status: Status.Idle
                                        }
                                    })
                                } else {
                                    state = {
                                        status: Status.ReInitializationScheduled,
                                        top: next_top,
                                        connection_terminate,
                                    }

                                    throttler.emit(() => {
                                        connection_terminate()

                                        state = {
                                            status: Status.Connected,
                                            top: next_top,
                                            connection_terminate: connect(next_top),
                                        }
                                    })
                                }
                            }

                            break
                        }
                        case Status.InitializationScheduled: {
                            throttler.interrupt()

                            state = {
                                status: Status.Idle
                            }

                            break
                        }
                        case Status.ReInitializationScheduled: {
                            if (state.top === param) {
                                throttler.interrupt()

                                const { connection_terminate } = state
                                const next_top = findtop(stack, comparator)

                                if (next_top === undefined) {
                                    state = {
                                        status: Status.TerminationScheduled,
                                        connection_terminate: state.connection_terminate,
                                    }

                                    throttler.emit(() => {
                                        connection_terminate()

                                        state = {
                                            status: Status.Idle
                                        }
                                    })
                                } else {
                                    state = {
                                        status: Status.ReInitializationScheduled,
                                        top: next_top,
                                        connection_terminate,
                                    }

                                    throttler.emit(() => {
                                        connection_terminate()

                                        state = {
                                            status: Status.Connected,
                                            top: next_top,
                                            connection_terminate: connect(next_top)
                                        }
                                    })
                                }
                            }

                            break
                        }
                    }
                }
            }
        }
    }
}
