import { ReqState_Status, type ReqState } from "#src/reqstate/type/state.js";

type Fallback<T> = () => T

type ReqState_DataFulfilled_Declaration = {
    <T>(reqstate: ReqState<T>): T | null
    <T, F>(reqstate: ReqState<T>, fallback: Fallback<F>): T | F
    <T, F>(reqstate: ReqState<T>, fallback?: Fallback<F>): T | F | null
}

export const reqstate_data_fulfilled: ReqState_DataFulfilled_Declaration = function <T, F>(
    reqstate: ReqState<T>, fallback?: Fallback<F>
): T | F | null {
    if (reqstate.status === ReqState_Status.Fulfilled) {
        return reqstate.data
    }

    return fallback?.() || null
}
