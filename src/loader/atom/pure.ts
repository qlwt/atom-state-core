import { loader_new_pure } from "#src/loader/new/pure.js";
import type { AtomLoader } from "#src/loader/type/AtomLoader.js";
import type { AtomSelectorStatic } from "#src/selector/type/AtomSelector.js";
import type { Throttler } from "#src/throttler/type/Throttler.js";
import { atomvalue_new } from "#src/value/atom/index.js";

export type AtomLoader_New_Pure_Params = {
    readonly throttler: Throttler
    readonly connect: AtomSelectorStatic<VoidFunction>
}

export const atomloader_new_pure = function(params: AtomLoader_New_Pure_Params): AtomLoader<[]> {
    return atomvalue_new(store => {
        return loader_new_pure({
            throttler: params.throttler,
            connect: () => params.connect(store)
        })
    })
}
