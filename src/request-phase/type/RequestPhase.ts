export enum RequestPhase_Status {
    Empty,
    Pending,
    Fulfilled
}

interface Template_RPO<Status extends RequestPhase_Status> {
    readonly status: Status
}

interface Template_RPOFulfilled<T> extends Template_RPO<RequestPhase_Status.Fulfilled> {
    readonly data: T
}

interface Template_RPOPending<T> extends Template_RPO<RequestPhase_Status.Pending> {
    readonly promise: Promise<RequestPhaseO<T>>
}

interface Template_RPPending<T> extends Template_RPOPending<T> {
    readonly abort: () => void
    readonly promise: Promise<RequestPhase<T>>
}

export type RequestPhase_Fulfilled<T = any> = Template_RPOFulfilled<T>
export type RequestPhase_Empty = Template_RPO<RequestPhase_Status.Empty>
export type RequestPhase_Pending<T = any> = Template_RPPending<T>

export type RequestPhase<T = any> = (
    | RequestPhase_Empty
    | RequestPhase_Pending<T>
    | RequestPhase_Fulfilled<T>
)

export type RequestPhaseO_Pending<T = any> = Template_RPOPending<T>
export type RequestPhaseO_Fulfilled<T = any> = Template_RPOFulfilled<T>
export type RequestPhaseO_Empty = Template_RPO<RequestPhase_Status.Empty>

export type RequestPhaseO<T = any> = (
    | RequestPhaseO_Empty
    | RequestPhaseO_Pending<T>
    | RequestPhaseO_Fulfilled<T>
)

export type RequestPhase_InferData<Src extends RequestPhaseO, F = never> = (
    (Src extends RequestPhaseO_Fulfilled<infer T>
        ? T
        : F
    )
)
