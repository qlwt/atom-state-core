import type { IndexerSearch, Indexer_InferData, Indexer_InferFilter, Indexer_InferRef } from "#src/indexer/type/indexer.js";
import * as sc from "@qyu/signal-core";

export const indexersearch_new_or = function <Src extends IndexerSearch<any, any, any>>(
    src: Src
): IndexerSearch<Indexer_InferRef<Src>, Indexer_InferData<Src>, readonly Indexer_InferFilter<Src>[]> {
    type Ref = Indexer_InferRef<Src>

    const map_watcher = new Map<sc.OSignal<ReadonlySet<Ref>>, sc.OSignal<ReadonlySet<Ref>>[]>()

    return {
        test: (filters, data) => {
            for (const filter of filters) {
                if (src.test(filter, data)) {
                    return true
                }
            }

            return false
        },

        find: (filters) => {
            if (filters.length === 0) {
                return new Set()
            }

            if (filters.length === 1) {
                return src.find(filters[0]!)
            }

            const result = new Set(src.find(filters[0]!))

            for (let i = 1; i < filters.length; ++i) {
                const refs = src.find(filters[i]!)

                refs.forEach(ref => { result.add(ref) })
            }

            return result
        },

        watcher_new: (filters) => {
            const deps = filters.map(filter => src.watcher_new(filter))

            const watcher = sc.osignal_new_pipe(
                sc.osignal_new_merge(deps),
                deps_o => {
                    if (deps_o.length === 0) {
                        return new Set<Indexer_InferRef<Src>>()
                    }

                    if (deps_o.length === 1) {
                        return deps_o[0]!
                    }

                    const result = new Set(deps_o[0]!)

                    for (let i = 1; i < filters.length; ++i) {
                        const refs = deps_o[i]!

                        refs.forEach(ref => { result.add(ref) })
                    }

                    return result
                }
            )

            return watcher
        },

        watcher_delete: (watcher) => {
            const deps = map_watcher.get(watcher)

            if (deps) {
                for (const dep of deps) {
                    src.watcher_delete(dep)
                }

                map_watcher.delete(watcher)
            }
        }
    }
}
