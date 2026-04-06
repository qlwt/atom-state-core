import { ReqState_Status, type ReqState } from "#src/reqstate/type/state.js";

type Fallback<T> = () => T

type ReqState_Data_Declaration = {
    <T>(reqstate: ReqState<T>): T | null
    <T, F>(reqstate: ReqState<T>, fallback: Fallback<F>): T | F
    <T, F>(reqstate: ReqState<T>, fallback?: Fallback<F>): T | F | null
}

export const reqstate_data: ReqState_Data_Declaration = function <T, F>(
    reqstate: ReqState<T>, fallback?: Fallback<F>
): T | F | null {
    switch (reqstate.status) {
        case ReqState_Status.Empty:
            break
        case ReqState_Status.Pending:
            if (reqstate.optimistic) {
                return reqstate.optimistic.value
            }

            if (reqstate.fallback && reqstate.fallback.status_view) {
                return reqstate.fallback.value
            }

            break
        case ReqState_Status.Fulfilled:
            return reqstate.data
    }

    return fallback ? fallback() : null
}
