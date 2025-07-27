import { ReqState__Status, type ReqState_Fulfilled } from "#src/reqstate/type/State.js"

export const reqstate_new_fulfilled = function<T>(data: T): ReqState_Fulfilled<T> {
    return {
        status: ReqState__Status.Fulfilled,

        data
    }
}
