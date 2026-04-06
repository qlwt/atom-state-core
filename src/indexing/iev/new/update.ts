import { Indexer_EventKind, type Indexer_InputEventUpdate } from "#src/indexing/type/indexer.js";

export const indexer_iev_new_update = function <Ref, Data>(ref: Ref, old_data: Data, now_data: Data): Indexer_InputEventUpdate<Ref, Data, null> {
    return [Indexer_EventKind.Update, ref, null, old_data, now_data]
}
