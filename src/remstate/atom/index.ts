import { remstate_new } from "#src/remstate/new/index.js";
import type { AtomRemState } from "#src/remstate/type/AtomRemote.js";
import { type ReqState } from "#src/reqstate/type/State.js";
import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js";
import { atomvalue_new } from "#src/value/atom/index.js";

export const atomremstate_new = function <T, PR, PM>(init: AtomSelectorStatic<ReqState<T>>): AtomRemState<T, PR, PM> {
    return atomvalue_new(store => {
        return remstate_new(init(store))
    })
}
