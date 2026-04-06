import type { State_Atom } from "#src/state/type/state.js"
import type { Store } from "#src/store/type/store.js"
import { value_atom_advanced } from "#src/value/atom/advanced.js"
import type { Value_Api, Value_ApiCache_Config } from "#src/value/type/value.js"
import * as sc from "@qyu/signal-core"

export type State_AtomAdvanced_Params<V> = {
    readonly init: V
    readonly config?: Value_ApiCache_Config
}

export const state_atom_advanced = function <V>(
    params: (store: Store, api: Value_Api<sc.Signal<V>>) => State_AtomAdvanced_Params<V>
): State_Atom<V> {
    return value_atom_advanced((store, api) => {
        const l_params = params(store, api)

        return {
            value: sc.signal_new_value(l_params.init),
            config: l_params.config,
        }
    })
}
