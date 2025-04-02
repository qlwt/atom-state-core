import { RequestPhase_Status, type RequestPhase_Empty, type RequestPhaseO_Empty } from "#src/request-phase/type/RequestPhase.js"

export const reqphase_new_empty = function(): RequestPhase_Empty {
    return {
        status: RequestPhase_Status.Empty
    }
}

export const reqphaseo_new_empty = function(): RequestPhaseO_Empty {
    return {
        status: RequestPhase_Status.Empty
    }
}
