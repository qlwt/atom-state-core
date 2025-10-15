import { atomfamily_new } from "#src/atom/family/new/index.js"
import type { AtomFamily } from "#src/atom/family/type/AtomFamily.js"
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js"
import { atomvalue_new } from "#src/atom/value/new/index.js"
import type { Indexer } from "#src/indexer/type/indexer.js"
import type * as sc from "@qyu/signal-core"

export type AtomFamily_NewIndexer_Params<Ref, Data, Filter, Param = Filter> = Readonly<{
    indexer: () => Indexer<Ref, Data, Filter>
    connect: (indexer: Indexer<Ref, Data, Filter>) => AtomSelectorStatic<VoidFunction>

    key?: (param: Param) => unknown
    param?: (param: Param) => Filter
}>

export const atomfamily_new_indexer = function <Ref, Data, Filter, Param = Filter>(
    params: AtomFamily_NewIndexer_Params<Ref, Data, Filter, Param>
): AtomFamily<Param, sc.OSignal<ReadonlySet<Ref>>> {
    return atomvalue_new(({ reg }) => {
        const indexer = params.indexer()

        reg(params.connect(indexer))

        return reg(atomfamily_new({
            key: params.key ?? JSON.stringify.bind(JSON),

            get: (param: Param) => {
                return atomvalue_new(() => {
                    if (params.param) {
                        return indexer.watcher_new(params.param(param))
                    }

                    return indexer.watcher_new(param as any as Filter)
                })
            }
        }))
    })
}
