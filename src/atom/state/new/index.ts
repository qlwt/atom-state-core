import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js"
import type { AtomState } from "#src/atom/state/type/AtomState.js"
import { atomvalue_new } from "#src/atom/value/new/index.js"
import * as sc from "@qyu/signal-core"

export const atomstate_new = function <T>(get: AtomSelectorStatic<T>): AtomState<T> {
    return atomvalue_new(store => {
        return sc.signal_new_value(get(store))
    })
}
