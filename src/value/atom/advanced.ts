import type { Store } from "#src/store/type/store.js"
import type { Value_Api, Value_ApiCache_Config, Value_Atom } from "#src/value/type/value.js"

export type ValueAtomAdvanced_Params<V> = {
    readonly value: V
    readonly config?: Value_ApiCache_Config
}

export const value_atom_advanced = function <V>(
    params: (store: Store, api: Value_Api<V>) => ValueAtomAdvanced_Params<V>
): Value_Atom<V> {
    return (store, api) => {
        const l_params = params(store, api)

        api.cache(l_params.value, l_params.config)

        return l_params.value
    }
}
