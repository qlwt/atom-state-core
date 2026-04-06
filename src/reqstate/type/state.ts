export enum ReqState_Status {
    Empty,
    Pending,
    Fulfilled
}

export type ReqState_Pending_Fallback<Data> = {
    readonly value: Data
    readonly status_view: boolean
}

export type ReqState_Pending_Optimistic<Data> = {
    readonly value: Data
}

export type ReqState_Pending<Data = any, PendingResult = any, PendingMeta = any> = {
    readonly status: ReqState_Status.Pending

    readonly meta: PendingMeta
    readonly fallback: ReqState_Pending_Fallback<Data> | null
    readonly optimistic: ReqState_Pending_Optimistic<Data> | null

    readonly request_abort: () => void
    readonly request_promise: Promise<PendingResult>
    readonly request_interpret: (result: PendingResult) => ReqState<Data, PendingResult, PendingMeta>
}

export type ReqState_Fulfilled<T = any> = {
    readonly status: ReqState_Status.Fulfilled
    readonly data: T
}

export type ReqState_Empty = {
    readonly status: ReqState_Status.Empty
    readonly error: null | { readonly value: any }
}

export type ReqState<Data = any, PendingResult = any, PendingMeta = any> = (
    | ReqState_Empty
    | ReqState_Fulfilled<Data>
    | ReqState_Pending<Data, PendingResult, PendingMeta>
)
