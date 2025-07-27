import { ReqState__Status, type ReqState } from "#src/reqstate/type/State.js";

type Fallback<T> = () => T

type ReqPhase_Data_Declaration = {
    <T>(reqstate: ReqState<T>): T | null
    <T, F>(reqstate: ReqState<T>, fallback: Fallback<F>): T | F
    <T, F>(reqstate: ReqState<T>, fallback?: Fallback<F>): T | F | null
}

export const reqstate_data: ReqPhase_Data_Declaration = function <T, F>(reqstate: ReqState<T>, fallback?: Fallback<F>): T | F | null {
    if (reqstate.status === ReqState__Status.Fulfilled) {
        return reqstate.data
    }

    return fallback?.() || null
}
