export type CallBatcher = {
    readonly interrupt: VoidFunction
    readonly emit: (cb: VoidFunction) => void
    readonly status_scheduled_new: () => boolean
}
