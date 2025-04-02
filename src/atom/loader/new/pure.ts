import type { AtomLoader } from "#src/atom/loader/type/AtomLoader.js";
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js";
import { atomvalue_new } from "#src/atom/value/new/index.js";
import type { Throttler } from "#src/throttler/type/Throttler.js";

export type AtomLoader_New_Pure_Params = {
    readonly throttler: Throttler
    readonly connect: AtomSelectorStatic<VoidFunction>
}

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
        readonly operation_cancel: VoidFunction
    }
    | {
        readonly status: Status.InitializationScheduled
        readonly operation_cancel: VoidFunction
    }
)

export const atomloader_new_pure = function(params: AtomLoader_New_Pure_Params): AtomLoader<[]> {
    const { throttler, connect } = params

    return atomvalue_new(store => {
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
                            const throttler_controls = throttler(() => {
                                state = {
                                    status: Status.Connected,
                                    connection_terminate: connect(store)
                                }
                            })

                            state = {
                                status: Status.InitializationScheduled,
                                operation_cancel: throttler_controls.interrupt
                            }

                            throttler_controls.emit()

                            break
                        }
                        case Status.TerminationScheduled: {
                            state.operation_cancel()

                            state = {
                                status: Status.Connected,
                                connection_terminate: state.connection_terminate
                            }

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

                                    const throttler_controls = throttler(() => {
                                        connection_terminate()

                                        state = {
                                            status: Status.Idle
                                        }
                                    })

                                    state = {
                                        status: Status.TerminationScheduled,
                                        connection_terminate,
                                        operation_cancel: throttler_controls.interrupt,
                                    }

                                    throttler_controls.emit()

                                    break
                                }
                                case Status.InitializationScheduled: {
                                    state.operation_cancel()

                                    state = { status: Status.Idle }

                                    break
                                }
                            }
                        }
                    }
                }
            }
        }
    })
}
