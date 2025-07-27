export enum ReqState__Status {
    Empty,
    Pending,
    Fulfilled
}

export type ReqState_Pending<Data = any, PendingResult = any, PendingMeta = any> = {
    readonly status: ReqState__Status.Pending

    readonly meta: PendingMeta
    readonly fallback: Data | null
    readonly optimistic: Data | null

    readonly request_abort: () => void
    readonly request_promise: Promise<PendingResult>
    readonly request_interpret: (result: PendingResult) => ReqState<Data, PendingResult, PendingMeta>
}

export type ReqState_Fulfilled<T = any> = {
    readonly status: ReqState__Status.Fulfilled
    readonly data: T
}

export type ReqState_Empty = {
    readonly status: ReqState__Status.Empty
}

export type ReqState<Data = any, PendingResult = any, PendingMeta = any> = (
    | ReqState_Empty
    | ReqState_Fulfilled<Data>
    | ReqState_Pending<Data, PendingResult, PendingMeta>
)
