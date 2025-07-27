import { ReqState__Status, type ReqState_Empty } from "#src/reqstate/type/State.js"

export const reqstate_new_empty = function(): ReqState_Empty {
    return {
        status: ReqState__Status.Empty
    }
}
