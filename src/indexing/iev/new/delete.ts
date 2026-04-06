import { Indexer_EventKind, type Indexer_InputEventDelete } from "#src/indexing/type/indexer.js";

export const indexer_iev_new_delete = function <Ref, Data>(ref: Ref, data: Data): Indexer_InputEventDelete<Ref, Data, null> {
    return [Indexer_EventKind.Delete, ref, null, data, null]
}
