import { Indexer_EventKind, type Indexer, type Indexer_InputEvent, type IndexerF } from "#src/indexing/type/indexer.js";

export type Indexer_NewWrapI_Params<Ref, O_Data, I_Data, I_Filter> = {
    readonly indexer: Indexer<Ref, O_Data, I_Filter>
    readonly data_new: (in_data: I_Data) => { readonly value: O_Data } | null
}

export const indexer_new_wrapi = function <Ref, O_Data, I_Data, I_Filter>(
    params: Indexer_NewWrapI_Params<Ref, O_Data, I_Data, I_Filter>
): Indexer<Ref, I_Data, I_Filter> {
    return {
        filter: params.indexer.filter.bind(params.indexer),

        input: <IMeta>(evs: Indexer_InputEvent<Ref, I_Data, IMeta>[]) => {
            const result: Indexer_InputEvent<Ref, O_Data, IMeta>[] = new Array(evs.length)

            for (let i = 0, j = 0; i < evs.length; ++i) {
                const ev = evs[i]!

                switch (ev[0]) {
                    case Indexer_EventKind.Delete: {
                        const old_data = params.data_new(ev[3]!)

                        if (old_data) {
                            result[j++] = [ev[0], ev[1], ev[2], old_data.value, null]
                        } else {
                            result.length -= 1
                        }

                        break
                    }
                    case Indexer_EventKind.Update: {
                        const old_data = params.data_new(ev[3]!)
                        const now_data = params.data_new(ev[4]!)

                        if (old_data) {
                            if (now_data) {
                                result[j++] = [Indexer_EventKind.Update, ev[1], ev[2], old_data.value, now_data.value]
                            } else {
                                result[j++] = [Indexer_EventKind.Delete, ev[1], ev[2], old_data.value, null]
                            }
                        } else if (now_data) {
                            result[j++] = [Indexer_EventKind.Add, ev[1], ev[2], null, now_data.value]
                        } else {
                            result.length -= 1
                        }

                        break
                    }
                    case Indexer_EventKind.Add: {
                        const now_data = params.data_new(ev[4]!)

                        if (now_data) {
                            result[j++] = [ev[0], ev[1], ev[2], null, now_data.value]
                        } else {
                            result.length -= 1
                        }

                        break
                    }
                }
            }

            params.indexer.input(result)
        },

        input_add: (ref, meta, now_idata) => {
            const now_data = params.data_new(now_idata)

            if (now_data) {
                params.indexer.input_add(ref, meta, now_data.value)
            }
        },

        input_delete: (ref, meta, old_idata) => {
            const old_data = params.data_new(old_idata)

            if (old_data) {
                params.indexer.input_delete(ref, meta, old_data.value)
            }
        },

        input_update: (ref, meta, old_idata, now_idata) => {
            const old_data = params.data_new(old_idata)
            const now_data = params.data_new(now_idata)

            if (old_data) {
                if (now_data) {
                    params.indexer.input_update(ref, meta, old_data.value, now_data.value)
                } else {
                    params.indexer.input_delete(ref, meta, old_data.value)
                }
            } else if (now_data) {
                params.indexer.input_add(ref, meta, now_data.value)
            }
        },
    }
}

export const indexer_newf_wrapi = function <Ref, O_Data, I_Data, I_Filter>(
    params: Indexer_NewWrapI_Params<Ref, O_Data, I_Data, I_Filter>
): IndexerF<Ref, I_Data, I_Filter> {
    return () => indexer_new_wrapi(params)
}
