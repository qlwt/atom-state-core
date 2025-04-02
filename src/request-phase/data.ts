import { RequestPhase_Status, type RequestPhaseO } from "#src/request-phase/type/RequestPhase.js";

type Fallback<T> = () => T

type ReqPhase_Data_Declaration = {
    <T>(reqphase: RequestPhaseO<T>): T | null
    <T, F>(reqphase: RequestPhaseO<T>, fallback: Fallback<F>): T | F
    <T, F>(reqphase: RequestPhaseO<T>, fallback?: Fallback<F>): T | F | null
}

export const reqphase_data: ReqPhase_Data_Declaration = function <T, F>(reqphase: RequestPhaseO<T>, fallback?: Fallback<F>): T | F | null {
    if (reqphase.status === RequestPhase_Status.Fulfilled) {
        return reqphase.data
    }

    return fallback?.() || null
}
