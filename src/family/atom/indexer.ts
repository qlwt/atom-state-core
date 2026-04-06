import { family_new_hash } from "#src/family/new/hash.js"
import type { Family_Atom } from "#src/family/type/family.js"
import type { Indexer, IndexerF } from "#src/indexing/type/indexer.js"
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"
import { value_atom } from "#src/value/atom/index.js"
import type * as sc from "@qyu/signal-core"

export type Family_AtomIndexer_Params<Ref, Data, Filter> = {
    readonly key: (param: Filter) => unknown
    readonly indexer_new: IndexerF<Ref, Data, Filter>
    readonly indexer_connect: (collector: Indexer<Ref, Data, Filter>) => VoidFunction
}

export const family_atom_indexer = function <Ref, Data, Filter>(
    params: SelectorStatic_Atom<Family_AtomIndexer_Params<Ref, Data, Filter>>
): Family_Atom<Filter, sc.OSignal<Iterable<Ref>>> {
    return value_atom(({ reg }) => {
        const l_params = reg(params)
        const indexer = l_params.indexer_new()
        const cleanup = l_params.indexer_connect(indexer)

        return family_new_hash({
            key: l_params.key ?? JSON.stringify.bind(JSON),

            get: (param, api) => {
                const watcher = indexer.filter([null, param])

                api.cache(watcher, { cleanup })

                return watcher
            }
        })
    })
}
