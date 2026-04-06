import { Indexer_EventKind, type IdxInput, type IdxInputF, type Indexer_InputEvent } from "#src/indexing/type/indexer.js";

export type Indexer_NewWrapIStrip_Params<Ref, O_Data, I_Data> = {
    readonly indexer: IdxInput<Ref, O_Data>
    readonly data_new: (in_data: I_Data) => { readonly value: O_Data } | null
}

export const indexer_new_wrapi_strip = function <Ref, Data, I_Data>(
    params: Indexer_NewWrapIStrip_Params<Ref, Data, I_Data>
): IdxInput<Ref, I_Data> {
    return {
        input: <IMeta>(evs: Indexer_InputEvent<Ref, I_Data, IMeta>[]) => {
            const result: Indexer_InputEvent<Ref, Data, IMeta>[] = new Array(evs.length)

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

export const indexer_newf_wrapi_strip = function <Ref, Data, I_Data>(
    params: Indexer_NewWrapIStrip_Params<Ref, Data, I_Data>
): IdxInputF<Ref, I_Data> {
    return () => indexer_new_wrapi_strip(params)
}
