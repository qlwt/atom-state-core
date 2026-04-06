import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"
import type { State_Atom } from "#src/state/type/state.js"
import { value_atom } from "#src/value/atom/index.js"
import * as sc from "@qyu/signal-core"

export const state_atom = function <T>(init: SelectorStatic_Atom<T>): State_Atom<T> {
    return value_atom(store => {
        return sc.signal_new_value(init(store))
    })
}
