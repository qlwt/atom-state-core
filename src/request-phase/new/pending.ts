import { RequestPhase_Status, type RequestPhase, type RequestPhase_Pending, type RequestPhaseO, type RequestPhaseO_Pending } from "#src/request-phase/type/RequestPhase.js"

export type RequestPhase_New_Pending_Params<T> = {
    readonly abort: VoidFunction
    readonly promise: Promise<RequestPhase<T>>
}

export const reqphase_new_pending = function <T>(params: RequestPhase_New_Pending_Params<T>): RequestPhase_Pending<T> {
    const { promise, abort} = params

    return {
        status: RequestPhase_Status.Pending,

        abort,
        promise,
    }
}

export const reqphaseo_new_pending = function <T>(promise: Promise<RequestPhaseO<T>>): RequestPhaseO_Pending<T> {
    return {
        status: RequestPhase_Status.Pending,

        promise
    }
}
