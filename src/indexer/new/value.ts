import type { Indexer } from "#src/indexer/type/indexer.js"
import * as sc from "@qyu/signal-core"

type Watcher<Ref> = sc.Signal<Set<Ref>, Set<Ref>>

type Dep<Ref> = {
    refs: Set<Ref>
    listeners: Set<Watcher<Ref>>
}

export type Indexer_NewValue_Filter<Value> = Value

export type Indexer_NewValue_Params = Readonly<{
}>

export const indexer_new_value = function <Ref, Value>(
    _params: Indexer_NewValue_Params
): Indexer<Ref, Value, Indexer_NewValue_Filter<Value>> {
    const map_dep = new Map<Value, Dep<Ref>>()
    const map_ref = new Map<Ref, { value: Value }>()
    const map_watcher = new Map<Watcher<Ref>, Value>()

    return {
        test: (filter, data) => {
            return data === filter
        },

        find: filter => {
            const result = map_dep.get(filter)

            if (result) {
                return result.refs
            }

            return new Set()
        },

        ref_delete: (ref) => {
            const now_data = map_ref.get(ref)

            if (now_data !== undefined) {
                const value = now_data.value
                const deps = map_dep.get(value)!

                // remove from current slot
                if (deps.refs.size > 1 || deps.listeners.size > 0) {
                    const now_refs = new Set(deps.refs)

                    now_refs.delete(ref)

                    {
                        deps.refs = now_refs

                        sc.batcher.batch_sync(() => {
                            deps.listeners.forEach(signal => {
                                signal.input(now_refs)
                            })
                        })
                    }
                } else {
                    map_dep.delete(value)
                }

                // clear ref
                {
                    map_ref.delete(ref)
                }
            }
        },

        ref_add: (ref, data) => {
            map_ref.set(ref, { value: data })

            const deps = map_dep.get(data)

            if (deps !== undefined) {
                const now_refs = new Set(deps.refs)

                now_refs.add(ref)

                deps.refs = now_refs

                sc.batcher.batch_sync(() => {
                    deps.listeners.forEach(signal => {
                        signal.input(now_refs)
                    })
                })
            } else {
                const now_refs = new Set<Ref>()

                now_refs.add(ref)

                map_dep.set(data, {
                    refs: now_refs,
                    listeners: new Set()
                })
            }
        },

        ref_update: (ref, now_data) => {
            const old_data = map_ref.get(ref)

            if (old_data === undefined) {
                return
            }

            if (old_data.value !== now_data) {
                sc.batcher.batch_sync(() => {
                    const now_deps = map_dep.get(now_data)
                    const old_deps = map_dep.get(old_data.value)!

                    // first delete from old deps
                    if (old_deps.refs.size > 1 || old_deps.listeners.size > 0) {
                        const now_refs = new Set(old_deps.refs)

                        now_refs.delete(ref)

                        {
                            old_deps.refs = now_refs

                            old_deps.listeners.forEach(signal => {
                                signal.input(now_refs)
                            })
                        }
                    } else {
                        map_dep.delete(now_data)
                    }

                    // add to new deps
                    // if now_deps exist - just add, else - create
                    if (now_deps !== undefined) {
                        const now_refs = new Set(now_deps.refs)

                        now_refs.add(ref)

                        now_deps.refs = now_refs

                        now_deps.listeners.forEach(signal => {
                            signal.input(now_refs)
                        })
                    } else {
                        const now_refs = new Set<Ref>()

                        now_refs.add(ref)

                        map_dep.set(now_data, {
                            refs: now_refs,
                            listeners: new Set(),
                        })
                    }

                    // update old_data
                    {
                        old_data.value = now_data
                    }
                })
            }
        },

        watcher_new: (filter) => {
            const deps = map_dep.get(filter)

            if (deps) {
                const watcher = sc.signal_new_value(deps.refs)

                deps.listeners.add(watcher)

                return watcher
            } else {
                const now_refs = new Set<Ref>()
                const watcher = sc.signal_new_value(now_refs)
                const now_listeners = new Set<Watcher<Ref>>()

                now_listeners.add(watcher)

                map_dep.set(filter, {
                    refs: now_refs,
                    listeners: now_listeners,
                })

                map_watcher.set(watcher, filter)

                return watcher
            }
        },

        watcher_delete: (watcher) => {
            if (map_watcher.has(watcher as Watcher<Ref>)) {
                const data = map_watcher.get(watcher as Watcher<Ref>)!
                const deps = map_dep.get(data)!

                if (deps.listeners.size > 1 || deps.refs.size > 0) {
                    deps.listeners.delete(watcher as Watcher<Ref>)
                } else {
                    map_dep.delete(data)
                }

                map_watcher.delete(watcher as Watcher<Ref>)
            }
        }
    }
}
