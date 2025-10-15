import type { IndexerSearch, Indexer_InferData, Indexer_InferFilter, Indexer_InferRef } from "#src/indexer/type/indexer.js";
import * as sc from "@qyu/signal-core";

export const indexersearch_new_and = function <Src extends IndexerSearch<any, any, any>>(
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

            const sorted = filters.map(filter => src.find(filter)).toSorted((a, b) => a.size - b.size)
            const result = new Set<Indexer_InferRef<Src>>()
            const baseline = src.find(filters[0]!)

            baseline.forEach(ref => {
                for (let i = 1; i < sorted.length; ++i) {
                    const refs = sorted[i]!

                    if (!refs.has(ref)) {
                        return
                    }
                }

                result.add(ref)
            })

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

                    deps_o.sort((a, b) => a.size - b.size)

                    const result = new Set<Indexer_InferRef<Src>>()
                    const baseline = deps_o[0]!

                    baseline.forEach(ref => {
                        for (let i = 1; i < deps_o.length; ++i) {
                            const refs = deps_o[i]!

                            if (!refs.has(ref)) {
                                return
                            }
                        }

                        result.add(ref)
                    })

                    return result
                }
            )

            map_watcher.set(watcher, deps)

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
        },
    }
}
