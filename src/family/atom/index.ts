import { atomvalue_new } from "#src/value/atom/index.js"
import type { AtomValue } from "#src/value/type/AtomValue.js"
import { family_new } from "#src/family/new/index.js"
import type { AtomFamily } from "#src/family/type/AtomFamily.js"

export type AtomFamily_New_Params<P, V> = {
    readonly key: (params: P) => unknown
    readonly get: (params: P) => AtomValue<V>
}

export const atomfamily_new = function <P, V>(
    params: AtomFamily_New_Params<P, V>
): AtomFamily<P, V> {
    return atomvalue_new(store => {
        return family_new({
            key: params.key,
            get: (param, cache) => params.get(param)(store, cache)
        })
    })
}
