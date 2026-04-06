import type { Query_Status } from "#src/query/type/status.js"
import * as sc from "@qyu/signal-core"

export type QueryPure = {
    readonly load: () => void
    readonly clear: VoidFunction
    readonly status: sc.OSignal<Query_Status>
}
