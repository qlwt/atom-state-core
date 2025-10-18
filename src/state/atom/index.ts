import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js"
import type { AtomState } from "#src/state/type/AtomState.js"
import { atomvalue_new } from "#src/value/atom/index.js"
import * as sc from "@qyu/signal-core"

export const atomstate_new = function <T>(get: AtomSelectorStatic<T>): AtomState<T> {
    return atomvalue_new(store => {
        return sc.signal_new_value(get(store))
    })
}
