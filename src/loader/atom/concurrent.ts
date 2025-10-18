import type { AtomLoader } from "#src/loader/type/AtomLoader.js"
import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js"
import { atomvalue_new } from "#src/value/atom/index.js"
import type { Throttler } from "#src/throttler/type/Throttler.js"
import { loader_new_concurrent } from "#src/loader/new/concurrent.js"

export type AtomLoader_New_Concurrent_Params<P extends readonly unknown[]> = {
    readonly throttler: Throttler
    readonly comparator: (a: P, b: P) => number
    readonly connect: (...params: P) => AtomSelectorStatic<VoidFunction>
}

export const atomloader_new_concurrent = function <P extends readonly unknown[]>(
    params: AtomLoader_New_Concurrent_Params<P>
): AtomLoader<P> {
    return atomvalue_new(store => {
        return loader_new_concurrent({
            throttler: params.throttler,
            comparator: params.comparator,
            connect: (...l_params) => params.connect(...l_params)(store)
        })
    })
}
