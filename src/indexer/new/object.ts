import type { Indexer, Indexer_InferData, Indexer_InferFilter } from "#src/indexer/type/indexer.js"
import * as sc from "@qyu/signal-core"

type Watcher<Ref> = sc.OSignal<ReadonlySet<Ref>>

type WatcherDep<Ref> = {
    watcher: Watcher<Ref>
    index: Indexer<Ref, unknown, unknown>
}

export type Indexer_NewObject_Fields<Ref> = Readonly<{
    [K in keyof any]: Indexer<Ref, any, any>
}>

export type Indexer_NewObject_Fields_InferRef<Fields extends Indexer_NewObject_Fields<any>> = (
    Fields extends Indexer_NewObject_Fields<infer Ref> ? Ref : never
)

export type Indexer_NewObject_Data<Fields extends Indexer_NewObject_Fields<any>> = {
    [K in keyof Fields]: Indexer_InferData<Fields[K]>
} | null | undefined

export type Indexer_NewObject_Filter<Fields extends Indexer_NewObject_Fields<any>> = Readonly<{
    [K in keyof Fields]?: Indexer_InferFilter<Fields[K]>
}>

export type Indexer_NewObject_Params<Fields extends Indexer_NewObject_Fields<any>> = Readonly<{
    fields: Fields
}>

export const indexer_new_object = function <Fields extends Indexer_NewObject_Fields<any>>(
    params: Indexer_NewObject_Params<Fields>
): Indexer<Indexer_NewObject_Fields_InferRef<Fields>, Indexer_NewObject_Data<Fields>, Indexer_NewObject_Filter<Fields>> {
    type Ref = Indexer_NewObject_Fields_InferRef<Fields>

    const map_rel = new Map<Ref, Set<keyof Fields>>()
    const map_watcher = new Map<Watcher<Ref>, WatcherDep<Ref>[]>()

    const result: Indexer<
        Indexer_NewObject_Fields_InferRef<Fields>,
        Indexer_NewObject_Data<Fields>,
        Indexer_NewObject_Filter<Fields>
    > = {
        test: (filter, data) => {
            if (data === undefined || data === null) {
                return false
            }

            const keys = Object.keys(filter) as (keyof Fields)[]

            for (const key of keys) {
                const key_field = params.fields[key]
                const key_filter = filter[key]

                if (key_field && key_filter) {
                    if (!key_field.test(key_filter, data[key])) {
                        return false
                    }
                }
            }

            return true
        },

        find: filter => {
            const keys = Object.keys(filter) as (keyof Fields)[]
            const lists: ReadonlySet<Ref>[] = []

            for (const key of keys) {
                const key_field = params.fields[key]
                const key_filter = filter[key]

                if (key_field !== undefined && key_filter !== undefined) {
                    const list = key_field.find(key_filter)

                    lists.push(list)
                }
            }

            if (lists.length === 0) {
                return new Set()
            } else if (lists.length === 1) {
                return lists[0]!
            }

            {
                lists.sort((a, b) => a.size - b.size)

                const result = new Set<Ref>()
                // smallest list
                const source = lists[0]!

                source.forEach(ref => {
                    for (let i = 1; i < lists.length; ++i) {
                        const list = lists[i]!

                        if (!list.has(ref)) {
                            return
                        }
                    }

                    result.add(ref)
                })

                return result
            }
        },

        ref_delete: (ref) => {
            sc.batcher.batch_sync(() => {
                const rels = map_rel.get(ref)

                if (rels) {
                    for (const key of rels) {
                        const key_field = params.fields[key]!

                        key_field.ref_delete(ref)
                    }

                    map_rel.delete(ref)
                }
            })
        },

        ref_add: (ref, data) => {
            sc.batcher.batch_sync(() => {
                if (data !== undefined && data !== null) {
                    const rels = new Set<keyof Fields>()
                    const keys = Object.keys(params.fields) as (keyof Fields)[]

                    for (const key of keys) {
                        if (key in data) {
                            const key_data = data[key]!
                            const key_field = params.fields[key]!

                            key_field.ref_add(ref, key_data)

                            rels.add(key)
                        }
                    }

                    map_rel.set(ref, rels)
                } else {
                    map_rel.set(ref, new Set())
                }
            })
        },

        ref_update: (ref, data) => {
            sc.batcher.batch_sync(() => {
                if (data === undefined || data === null) {
                    const rels = map_rel.get(ref)

                    if (rels) {
                        for (const rel of rels) {
                            const rel_field = params.fields[rel]!

                            rel_field.ref_delete(ref)
                        }

                        rels.clear()
                    }
                } else {
                    const old_rels = map_rel.get(ref)
                    const new_rels = new Set<keyof Fields>()

                    if (old_rels) {
                        const keys = Object.keys(params.fields) as (keyof Fields)[]

                        for (const key of keys) {
                            if (key in data) {
                                const key_data = data[key]!
                                const key_field = params.fields[key]!

                                if (old_rels.has(key)) {
                                    key_field.ref_update(ref, key_data)

                                    old_rels.delete(key)
                                } else {
                                    key_field.ref_add(ref, key_data)
                                }

                                new_rels.add(key)
                            }
                        }

                        for (const rel of old_rels) {
                            const rel_field = params.fields[rel]!

                            rel_field.ref_delete(ref)
                        }

                        map_rel.set(ref, new_rels)
                    }
                }
            })
        },

        watcher_new: (filter) => {
            const watcherdep: WatcherDep<Ref>[] = []
            const children: Watcher<Ref>[] = []
            const keys = Object.keys(filter) as (keyof Fields)[]

            for (const key of keys) {
                const key_filter = filter[key]
                const key_field = params.fields[key]

                if (key_filter !== undefined && key_field !== undefined) {
                    const key_watcher = key_field.watcher_new(key_filter)

                    children.push(key_watcher)
                    watcherdep.push({ index: key_field, watcher: key_watcher })
                }
            }

            const watcher = sc.osignal_new_pipe(
                sc.osignal_new_merge(children),
                lists => {
                    if (lists.length === 0) {
                        return new Set<Ref>()
                    } else if (lists.length === 1) {
                        return lists[0]!
                    }

                    {
                        lists.sort((a, b) => a.size - b.size)

                        const result = new Set<Ref>()
                        // smallest list
                        const source = lists[0]!

                        source.forEach(ref => {
                            for (let i = 1; i < lists.length; ++i) {
                                const list = lists[i]!

                                if (!list.has(ref)) {
                                    return
                                }
                            }

                            result.add(ref)
                        })

                        return result
                    }
                }
            )

            map_watcher.set(watcher, watcherdep)

            return watcher
        },

        watcher_delete: watcher => {
            const watcherdeps = map_watcher.get(watcher)

            if (watcherdeps) {
                for (const watcherdep of watcherdeps) {
                    watcherdep.index.watcher_delete(watcherdep.watcher)
                }

                map_watcher.delete(watcher)
            }
        },
    }

    return result
}
