import { ReqState_Status, type ReqState_Fulfilled } from "#src/reqstate/type/state.js"

export const reqstate_new_fulfilled = function<T>(data: T): ReqState_Fulfilled<T> {
    return {
        status: ReqState_Status.Fulfilled,

        data
    }
}
