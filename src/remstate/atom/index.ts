import { remstate_new } from "#src/remstate/new/index.js";
import type { RemState_Atom } from "#src/remstate/type/remstate.js";
import { type ReqState } from "#src/reqstate/type/state.js";
import { value_atom } from "#src/value/atom/index.js";

export const remstate_atom = function <T, PR = any, PM = any>(init: () => ReqState<T>): RemState_Atom<T, PR, PM> {
    return value_atom(() => {
        return remstate_new(init())
    })
}
