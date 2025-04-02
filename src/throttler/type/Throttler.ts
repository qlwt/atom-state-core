export type Throttler = (callback: VoidFunction) => {
    emit: () => void
    interrupt: () => void
}
