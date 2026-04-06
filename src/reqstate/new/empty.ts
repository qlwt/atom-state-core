import { ReqState_Status, type ReqState_Empty } from "#src/reqstate/type/state.js"

export type ReqState_NewEmty_Params = {
    readonly error?: { readonly value: any } | null
}

export const reqstate_new_empty = function(params: ReqState_NewEmty_Params): ReqState_Empty {
    return {
        status: ReqState_Status.Empty,
        error: params.error ?? null,
    }
}
