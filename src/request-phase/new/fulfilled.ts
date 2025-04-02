import { RequestPhase_Status, type RequestPhase_Fulfilled, type RequestPhaseO_Fulfilled } from "#src/request-phase/type/RequestPhase.js"

export const reqphase_new_fulfilled = function<T>(data: T): RequestPhase_Fulfilled<T> {
    return {
        status: RequestPhase_Status.Fulfilled,

        data
    }
}

export const reqphaseo_new_fulfilled = function<T>(data: T): RequestPhaseO_Fulfilled<T> {
    return {
        status: RequestPhase_Status.Fulfilled,

        data
    }
}
