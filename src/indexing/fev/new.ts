import type { Indexer_FilterEvent } from "#src/indexing/type/indexer.js";

export const indexer_fev_new = function <Filter>(filter: Filter): Indexer_FilterEvent<Filter, null> {
    return [null, filter]
}
