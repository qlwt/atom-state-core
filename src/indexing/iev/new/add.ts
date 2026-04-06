import { Indexer_EventKind, type Indexer_InputEventAdd } from "#src/indexing/type/indexer.js";

export const indexer_iev_new_add = function <Ref, Data>(ref: Ref, data: Data): Indexer_InputEventAdd<Ref, Data, null> {
    return [Indexer_EventKind.Add, ref, null, null, data]
}
