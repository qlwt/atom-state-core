import type { Loader } from "#src/loader/type/loader.js";
import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js";

enum Status {
    Idle = "Idle",
    Connected = "Connected",
    TerminationScheduled = "TerminationScheduled",
    InitializationScheduled = "InitializationScheduled"
}

type State = (
    | {
        readonly status: Status.Idle
    }
    | {
        readonly status: Status.Connected
        readonly connection_terminate: VoidFunction
    }
    | {
        readonly status: Status.TerminationScheduled
        readonly connection_terminate: VoidFunction
    }
    | {
        readonly status: Status.InitializationScheduled
    }
)

export type Loader_NewPure_Params = {
    readonly callbatcher: CallBatcher
    readonly connect: () => VoidFunction
}

export const loader_new_pure = function(params: Loader_NewPure_Params): Loader<void> {
    const { callbatcher, connect } = params

    let counter = 0
    let state: State = { status: Status.Idle }

    return {
        request: () => {
            let canceled = false

            {
                counter += 1
            }

            if (counter === 1) {
                switch (state.status) {
                    case Status.Idle: {

                        state = {
                            status: Status.InitializationScheduled,
                        }

                        callbatcher.emit(() => {
                            state = {
                                status: Status.Connected,
                                connection_terminate: connect()
                            }
                        })

                        break
                    }
                    case Status.TerminationScheduled: {
                        state = {
                            status: Status.Connected,
                            connection_terminate: state.connection_terminate
                        }

                        callbatcher.interrupt()

                        break
                    }
                }
            }

            return () => {
                if (!canceled) {
                    counter -= 1
                    canceled = true

                    if (counter === 0) {
                        switch (state.status) {
                            case Status.Connected: {
                                const { connection_terminate } = state

                                state = {
                                    status: Status.TerminationScheduled,
                                    connection_terminate,
                                }

                                callbatcher.emit(() => {
                                    connection_terminate()

                                    state = {
                                        status: Status.Idle
                                    }
                                })

                                break
                            }
                            case Status.InitializationScheduled: {
                                callbatcher.interrupt()

                                state = { status: Status.Idle }

                                break
                            }
                        }
                    }
                }
            }
        }
    }
}
